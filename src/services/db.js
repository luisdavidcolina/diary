import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc, setDoc } from "firebase/firestore/lite";
import { db, auth } from "../firebase";

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
export const addTransaction = async (amount, description, type = 'expense', category = null, telegramFileId = null, opts = {}) => {
  const { currency = 'USD', rate = null } = opts || {};
  const amt = parseFloat(amount) || 0;
  const amountUSD = currency === 'VES' && rate ? amt / parseFloat(rate) : amt;

  const payload = {
    userId: uid(), amount: amt, currency, description, type, category,
    amountUSD: Number(amountUSD.toFixed(2)),
    createdAt: new Date().toISOString()
  };
  if (rate) payload.rate = parseFloat(rate);
  if (telegramFileId) payload.telegramFileId = telegramFileId;

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
export const addOrUpdateAccount = async (id, name, currency, balance) => {
  const payload = { name, currency, balance: parseFloat(balance), updatedAt: new Date().toISOString() };
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
