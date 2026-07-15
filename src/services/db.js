import { collection, addDoc, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../firebase";

export const addNote = async (subjectId, content, type = 'note') => {
  try {
    const docRef = await addDoc(collection(db, "notes"), {
      subjectId,
      content,
      type,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (e) {
    console.error("Error adding document: ", e);
    throw e;
  }
};

export const getNotes = async (subjectId) => {
  try {
    const q = query(
      collection(db, "notes"), 
      where("subjectId", "==", subjectId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const notes = [];
    querySnapshot.forEach((doc) => {
      notes.push({ id: doc.id, ...doc.data() });
    });
    return notes;
  } catch (e) {
    console.error("Error getting documents: ", e);
    throw e;
  }
};

// =============================
// FINANZAS (Transacciones)
// =============================
export const addTransaction = async (amount, description, type = 'expense') => {
  try {
    const docRef = await addDoc(collection(db, "transactions"), {
      amount: parseFloat(amount),
      description,
      type, // 'expense' o 'income'
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (e) {
    console.error("Error adding transaction: ", e);
    throw e;
  }
};

export const getTransactions = async () => {
  try {
    const q = query(collection(db, "transactions"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const transactions = [];
    querySnapshot.forEach((doc) => {
      transactions.push({ id: doc.id, ...doc.data() });
    });
    return transactions;
  } catch (e) {
    console.error("Error getting transactions: ", e);
    throw e;
  }
};

// =============================
// CUENTAS Y WALLETS (Multimoneda)
// =============================
export const addOrUpdateAccount = async (id, name, currency, balance) => {
  try {
    if (id) {
      // Actualizar cuenta existente (opcional, para una v2)
      // En MVP, podemos solo añadir
    }
    const docRef = await addDoc(collection(db, "accounts"), {
      name,
      currency, // 'BS' o 'USD'
      balance: parseFloat(balance),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (e) {
    console.error("Error saving account: ", e);
    throw e;
  }
};

export const getAccounts = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "accounts"));
    const accounts = [];
    querySnapshot.forEach((doc) => {
      accounts.push({ id: doc.id, ...doc.data() });
    });
    return accounts;
  } catch (e) {
    console.error("Error getting accounts: ", e);
    throw e;
  }
};

// =============================
// HABITOS Y TAREAS (Lifestyle)
// =============================
export const addHabitOrTask = async (title, category = 'task') => {
  try {
    const docRef = await addDoc(collection(db, "lifestyle"), {
      title,
      category, // 'task' o 'habit'
      isCompleted: false,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (e) {
    console.error("Error adding lifestyle item: ", e);
    throw e;
  }
};

export const getLifestyleItems = async () => {
  try {
    const q = query(collection(db, "lifestyle"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const items = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    return items;
  } catch (e) {
    console.error("Error getting lifestyle items: ", e);
    throw e;
  }
};

// =============================
// DIARIO PERSONAL (Journaling)
// =============================
export const addJournalEntry = async (content, mood) => {
  try {
    const docRef = await addDoc(collection(db, "journal_entries"), {
      content,
      mood,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (e) {
    console.error("Error adding journal entry: ", e);
    throw e;
  }
};

export const getJournalEntries = async () => {
  try {
    const q = query(collection(db, "journal_entries"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const entries = [];
    querySnapshot.forEach((doc) => {
      entries.push({ id: doc.id, ...doc.data() });
    });
    return entries;
  } catch (e) {
    console.error("Error getting journal entries: ", e);
    throw e;
  }
};
