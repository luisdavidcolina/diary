import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc } from "firebase/firestore";
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
export const addTransaction = async (amount, description, type = 'expense') => {
  const docRef = await addDoc(collection(db, "transactions"), {
    userId: uid(), amount: parseFloat(amount), description, type, createdAt: new Date().toISOString()
  });
  return docRef.id;
};

export const getTransactions = () => fetchMine("transactions");

export const deleteTransaction = (id) => deleteDoc(doc(db, "transactions", id));

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
export const addHabitOrTask = async (title, category = 'task') => {
  const docRef = await addDoc(collection(db, "lifestyle"), {
    userId: uid(), title, category, isCompleted: false, createdAt: new Date().toISOString()
  });
  return docRef.id;
};

export const getLifestyleItems = () => fetchMine("lifestyle");

export const setLifestyleCompleted = (id, isCompleted) =>
  updateDoc(doc(db, "lifestyle", id), { isCompleted });

export const deleteLifestyleItem = (id) => deleteDoc(doc(db, "lifestyle", id));

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
