import { dbNode } from '../../api/_firebaseNode.js';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore/lite';

(async () => {
  console.log('🔧 Agregando cuenta de Binance a Firestore...');
  try {
    const ownerSnap = await getDoc(doc(dbNode, "config", "owner"));
    const userId = ownerSnap.exists() ? ownerSnap.data().uid : null;

    if (!userId) {
      console.error('❌ No se encontró el userId en config/owner.');
      return;
    }

    const accountsCol = collection(dbNode, 'accounts');
    await addDoc(accountsCol, {
      name: 'Binance USDT',
      currency: 'USD',
      balance: 324.29,
      accountNumber: '',
      userId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.log('✅ Cuenta "Binance USDT" agregada exitosamente con un saldo de $324.29.');
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
