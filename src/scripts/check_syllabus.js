import { dbNode } from '../../api/_firebaseNode.js';
import { collection, getDocs } from 'firebase/firestore/lite';

(async () => {
  console.log('🔧 Revisando colección syllabus...');
  try {
    const snap = await getDocs(collection(dbNode, 'syllabus'));
    console.log(`Total documentos: ${snap.size}`);
    
    // Mostramos los primeros 10
    let count = 0;
    for (const d of snap.docs) {
      if (count >= 10) break;
      const data = d.data();
      console.log(`- ID: ${d.id} | Subject: ${data.subject} | Title: ${data.title}`);
      count++;
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
