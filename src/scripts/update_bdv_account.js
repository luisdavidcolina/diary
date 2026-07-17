import { dbNode } from '../../api/_firebaseNode.js';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore/lite';

(async () => {
  console.log('🔧 Actualizando número de cuenta de BDV...');
  try {
    const accountsCol = collection(dbNode, 'accounts');
    const snapshot = await getDocs(accountsCol);
    let updated = false;

    for (const d of snapshot.docs) {
      const data = d.data();
      if (data.name === 'BDV Cuenta Corriente') {
        await updateDoc(doc(dbNode, 'accounts', d.id), {
          accountNumber: '01020727440000259550',
          updatedAt: new Date().toISOString()
        });
        console.log(`✅ Cuenta "${data.name}" actualizada con el número: 01020727440000259550`);
        updated = true;
      }
    }

    if (!updated) {
      console.log('⚠️ No se encontró la cuenta BDV Cuenta Corriente.');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
