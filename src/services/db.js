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
