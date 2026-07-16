import { dbNode } from '../../api/_firebaseNode.js';
import { collection, getDocs, addDoc } from 'firebase/firestore/lite';

(async () => {
  console.log('🔁 Duplicando registros de cuentas...');
  try {
    const accountsCol = collection(dbNode, 'accounts');
    const snapshot = await getDocs(accountsCol);
    let count = 0;
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const newData = {
        ...data,
        name: `${data.name} (copia)`,
        // Si necesitas que el número de cuenta sea único, modifícalo aquí
      };
      await addDoc(accountsCol, newData);
      count++;
    }
    console.log(`✅ ${count} cuentas duplicadas exitosamente.`);
  } catch (e) {
    console.error('❌ Error duplicando cuentas:', e);
  }
})();
