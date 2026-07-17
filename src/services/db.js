import { collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc, deleteDoc, setDoc } from "firebase/firestore/lite";
import { db, auth } from "../firebase";
import { ITEMS, SUBJECTS } from "../data/syllabus";

// UID del usuario actual. Todos los datos se scopean por usuario para que
// cada cuenta vea solo lo suyo.
const uid = () => auth.currentUser?.uid || null;

// Ordena por createdAt desc en el cliente (evita índices compuestos en Firestore).
const byNewest = (arr) =>
  [...arr].sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));

// Trae todos los docs de una colección que pertenecen al usuario actual.
async function fetchMine(collectionName) {
  const q = query(collection(db, collectionName), where("userId", "==", uid()));
  const snap = await getDocs(q);
  const out = [];
  snap.forEach((d) => out.push({ id: d.id, ...d.data() }));
  return byNewest(out);
}

// ─────────── CRUD genérico (para el asistente IA) ───────────
// Colecciones sobre las que la IA puede operar. Whitelist = seguridad.
export const AI_COLLECTIONS = ['transactions', 'journal_entries', 'lifestyle', 'accounts', 'library_items', 'syllabus', 'bot_knowledge'];

function assertAllowed(name) {
  if (!AI_COLLECTIONS.includes(name)) throw new Error(`Colección no permitida: ${name}`);
}

export const queryCollection = (name) => {
  assertAllowed(name);
  return fetchMine(name);
};

export const createRecord = async (name, data) => {
  assertAllowed(name);
  const docRef = await addDoc(collection(db, name), {
    userId: uid(), ...data, createdAt: new Date().toISOString()
  });
  return docRef.id;
};

export const updateRecord = (name, id, data) => {
  assertAllowed(name);
  return updateDoc(doc(db, name, id), { ...data, updatedAt: new Date().toISOString() });
};

export const deleteRecord = (name, id) => {
  assertAllowed(name);
  return deleteDoc(doc(db, name, id));
};

// ─────────── Cerebro del asistente (editable desde la web) ───────────
export const DEFAULT_BOT_CONFIG = {
  botName: 'Luisda Bot',
  persona: '',
  ownerProfile: '',
  tone: 'cercano',
  responseLength: 'corto',
  useEmojis: true,
  customRules: [],
  model: 'openai/gpt-4o-mini'
};

export async function getBotConfig() {
  try {
    const snap = await getDoc(doc(db, "config", "bot"));
    return snap.exists() ? { ...DEFAULT_BOT_CONFIG, ...snap.data() } : { ...DEFAULT_BOT_CONFIG };
  } catch (e) {
    console.error("getBotConfig error", e);
    return { ...DEFAULT_BOT_CONFIG };
  }
}

export function saveBotConfig(config) {
  return setDoc(doc(db, "config", "bot"), { ...config, updatedAt: new Date().toISOString() });
}

// Registra el uid del dueño en config/owner para que el bot de Telegram sepa
// a quién pertenecen los datos (evita tener que configurar OWNER_UID a mano).
export async function registerOwner() {
  const u = uid();
  if (!u) return;
  try {
    await setDoc(doc(db, "config", "owner"), { uid: u, updatedAt: new Date().toISOString() });
  } catch (e) {
    console.error("registerOwner error", e);
  }
}

// ─────────── Sincronización del temario a Firestore ───────────
// Guarda TODO el temario (src/data/syllabus.js) en la colección `syllabus`,
// scopeado por usuario, para que los chatbots (web y Telegram) lo consulten.
// Idempotente: usa `${uid}_${itemId}` como id del documento (no duplica).
const SYLLABUS_VERSION = 1;

export async function syncSyllabus() {
  const u = uid();
  if (!u) return;
  await Promise.all(
    ITEMS.map((it) =>
      setDoc(doc(db, "syllabus", `${u}_${it.id}`), {
        userId: u,
        itemId: it.id,
        subject: it.subject,
        subjectTitle: SUBJECTS[it.subject]?.title || it.subject,
        unit: it.unit,
        title: it.title,
        details: it.details || [],
        createdAt: new Date().toISOString()
      })
    )
  );
}

// Sincroniza una sola vez por versión (evita reescribir en cada carga).
export async function syncSyllabusIfNeeded() {
  try {
    const key = `diary.syllabusSync.${uid()}`;
    if (localStorage.getItem(key) === String(SYLLABUS_VERSION)) return;
    await syncSyllabus();
    localStorage.setItem(key, String(SYLLABUS_VERSION));
  } catch (e) {
    console.error("syncSyllabus error", e);
  }
}

// =============================
// APUNTES (Notes)
// =============================
export const addNote = async (subjectId, content, type = 'note') => {
  const docRef = await addDoc(collection(db, "notes"), {
    userId: uid(), subjectId, content, type, createdAt: new Date().toISOString()
  });
  return docRef.id;
};

export const getNotes = async (subjectId) => {
  const q = query(collection(db, "notes"), where("userId", "==", uid()), where("subjectId", "==", subjectId));
  const snap = await getDocs(q);
  const out = [];
  snap.forEach((d) => out.push({ id: d.id, ...d.data() }));
  return byNewest(out);
};

export const deleteNote = (id) => deleteDoc(doc(db, "notes", id));

// =============================
// FINANZAS (Transacciones)
// =============================
// opts: { currency: 'USD'|'VES', rate: number|null }
// Toda transacción guarda su equivalente en USD (amountUSD) para sumar en una sola
// moneda. En Bs se divide por la tasa (Binance por defecto, o una manual puntual).
export const addTransaction = async (amount, description, type = 'expense', category = null, telegramFileIds = null, opts = {}) => {
  const { currency = 'USD', rate = null, accountId = null, createdAt = null } = opts || {};
  const amt = parseFloat(amount) || 0;
  const amountUSD = currency === 'VES' && rate ? amt / parseFloat(rate) : amt;

  let balanceBefore = null;
  let balanceAfter = null;
  let accountName = null;

  if (accountId) {
    try {
      const accRef = doc(db, "accounts", accountId);
      const accSnap = await getDoc(accRef);
      if (accSnap.exists()) {
        accountName = accSnap.data().name || '';
        balanceBefore = parseFloat(accSnap.data().balance) || 0;
        const change = type === 'expense' ? -amt : amt;
        balanceAfter = Number((balanceBefore + change).toFixed(2));
        await updateDoc(accRef, { balance: balanceAfter, updatedAt: new Date().toISOString() });
      }
    } catch (e) {
      console.error("Error updating account balance:", e);
    }
  }

  const payload = {
    userId: uid(), amount: amt, currency, description, type, category,
    amountUSD: Number(amountUSD.toFixed(2)),
    createdAt: createdAt || new Date().toISOString()
  };
  if (rate) payload.rate = parseFloat(rate);
  if (accountId) {
    payload.accountId = accountId;
    if (accountName !== null) payload.accountName = accountName;
    if (balanceBefore !== null) payload.balanceBefore = balanceBefore;
    if (balanceAfter !== null) payload.balanceAfter = balanceAfter;
  }
  if (telegramFileIds) {
    payload.telegramFileIds = Array.isArray(telegramFileIds) ? telegramFileIds : [telegramFileIds];
    payload.telegramFileId = payload.telegramFileIds[0] || null; // for backward compatibility
  }

  const docRef = await addDoc(collection(db, "transactions"), payload);
  return docRef.id;
};

export const getTransactions = () => fetchMine("transactions");

// Corrige/actualiza una transacción (usado por la IA para arreglar registros erróneos).
export const updateTransaction = (id, patch) =>
  updateDoc(doc(db, "transactions", id), { ...patch, updatedAt: new Date().toISOString() });

export const deleteTransaction = (id) => deleteDoc(doc(db, "transactions", id));

export const uploadReceiptImage = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const res = await fetch('/api/upload-telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: reader.result })
        });
        const json = await res.json();
        if (json.success) resolve(json.fileId);
        else reject(json.error);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = error => reject(error);
  });
};

export const getFinanceLimits = async () => {
  const q = query(collection(db, "finance_limits"), where("userId", "==", uid()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data().limits;
};

export const saveFinanceLimits = async (limitsObj) => {
  // Save or update user limits
  const q = query(collection(db, "finance_limits"), where("userId", "==", uid()));
  const snap = await getDocs(q);
  if (snap.empty) {
    await addDoc(collection(db, "finance_limits"), { userId: uid(), limits: limitsObj });
  } else {
    await updateDoc(doc(db, "finance_limits", snap.docs[0].id), { limits: limitsObj });
  }
};

// =============================
// CUENTAS Y WALLETS (Multimoneda)
// =============================
export const addOrUpdateAccount = async (id, name, currency, balance, accountNumber = '') => {
  const payload = { name, currency, balance: parseFloat(balance), accountNumber, updatedAt: new Date().toISOString() };
  if (id) {
    await updateDoc(doc(db, "accounts", id), payload);
    return id;
  }
  const docRef = await addDoc(collection(db, "accounts"), {
    userId: uid(), createdAt: new Date().toISOString(), ...payload
  });
  return docRef.id;
};

export const getAccounts = () => fetchMine("accounts");

export const deleteAccount = (id) => deleteDoc(doc(db, "accounts", id));

// =============================
// HABITOS Y TAREAS (Lifestyle)
// =============================
export const addHabitOrTask = async (title, category = 'task', reminderDate = null, reminderTime = null) => {
  const payload = {
    userId: uid(), title, category, isCompleted: false, createdAt: new Date().toISOString()
  };
  if (reminderDate) payload.reminderDate = reminderDate;
  if (reminderTime) payload.reminderTime = reminderTime;

  const docRef = await addDoc(collection(db, "lifestyle"), payload);
  return docRef.id;
};

export const getLifestyleItems = () => fetchMine("lifestyle");

export const setLifestyleCompleted = (id, isCompleted) =>
  updateDoc(doc(db, "lifestyle", id), { isCompleted });

export const updateLifestyleReminderId = (id, reminderId, isRecurring = false) =>
  updateDoc(doc(db, "lifestyle", id), { reminderId, isRecurring });

export const deleteLifestyleItem = (id) => deleteDoc(doc(db, "lifestyle", id));

// Registro de actividad diaria (para heatmap y racha). Un doc por completado.
export const logHabitCompletion = async (date) => {
  const docRef = await addDoc(collection(db, "habit_logs"), {
    userId: uid(), date, createdAt: new Date().toISOString()
  });
  return docRef.id;
};

export const getHabitLogs = () => fetchMine("habit_logs");

// =============================
// DIARIO PERSONAL (Journaling)
// =============================
export const addJournalEntry = async (content, mood) => {
  const docRef = await addDoc(collection(db, "journal_entries"), {
    userId: uid(), content, mood, createdAt: new Date().toISOString()
  });
  return docRef.id;
};

export const getJournalEntries = () => fetchMine("journal_entries");

export const deleteJournalEntry = (id) => deleteDoc(doc(db, "journal_entries", id));

// =============================
// BIBLIOTECA DE CONTENIDO (Read-it-Later)
// =============================
export const addLibraryItem = async (title, url, type) => {
  const docRef = await addDoc(collection(db, "library_items"), {
    userId: uid(), title, url, type, status: 'unread', createdAt: new Date().toISOString()
  });
  return docRef.id;
};

export const getLibraryItems = () => fetchMine("library_items");

export const updateLibraryItemStatus = (id, status) =>
  updateDoc(doc(db, "library_items", id), { status, updatedAt: new Date().toISOString() });

export const deleteLibraryItem = (id) => deleteDoc(doc(db, "library_items", id));

// =============================
// HISTORIAL DE CHAT (Asistente Web)
// =============================
export const createChatSession = async (title = "Nuevo Chat") => {
  const docRef = await addDoc(collection(db, "chat_sessions"), {
    userId: uid(),
    title,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
};

export const getChatSessions = () => fetchMine("chat_sessions");

export const deleteChatSession = async (sessionId) => {
  // Delete the session document
  await deleteDoc(doc(db, "chat_sessions", sessionId));
  
  // Delete all messages associated with this session
  const q = query(collection(db, "chat_history"), where("sessionId", "==", sessionId));
  const snap = await getDocs(q);
  const deletePromises = [];
  snap.forEach(d => {
    deletePromises.push(deleteDoc(doc(db, "chat_history", d.id)));
  });
  await Promise.all(deletePromises);
};

export const addChatMessage = async (sessionId, role, content, functionCall = null, toolResult = null, images = null) => {
  const payload = {
    userId: uid(),
    sessionId,
    role,
    content,
    createdAt: new Date().toISOString()
  };
  if (functionCall) payload.functionCall = functionCall;
  if (toolResult) payload.toolResult = toolResult;
  if (images) payload.images = images;
  
  const docRef = await addDoc(collection(db, "chat_history"), payload);
  return docRef.id;
};

export const getChatMessages = async (sessionId) => {
  if (!sessionId) return [];
  const q = query(collection(db, "chat_history"), where("userId", "==", uid()), where("sessionId", "==", sessionId));
  const snap = await getDocs(q);
  const out = [];
  snap.forEach((d) => out.push({ id: d.id, ...d.data() }));
  return out.sort((a, b) => (a.createdAt > b.createdAt ? 1 : a.createdAt < b.createdAt ? -1 : 0)); // Ascending
};

// =============================
// LOGS DE CONSUMO API
// =============================
export const getApiUsageLogs = async () => {
  const snap = await getDocs(collection(db, "api_usage"));
  const out = [];
  snap.forEach((d) => out.push({ id: d.id, ...d.data() }));
  return out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 50); // Últimos 50
};

