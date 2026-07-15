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
