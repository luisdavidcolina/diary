import { dbNode } from '../../api/_firebaseNode.js';
import { collection, addDoc } from 'firebase/firestore/lite';

const cuentas = [
  {
    name: 'Cuenta Corriente Amiga',
    currency: 'BS',
    balance: 112952.89,
    accountNumber: '01720116671165034610',
    userId: 'owner' // We will get the real owner UID or use a placeholder, wait. Let's resolve it.
  },
  {
    name: 'Bancamiga Cash USD',
    currency: 'USD',
    balance: 0,
    accountNumber: '01720116681165037787',
  },
  {
    name: 'BCP Cuentas de Ahorro Soles',
    currency: 'PEN',
    balance: 1.22,
    accountNumber: '19493427507017',
  },
  {
    name: 'BCP Corriente Soles',
    currency: 'PEN',
    balance: 1.00,
    accountNumber: '5159049815090',
  },
  {
    name: 'BCP Cuentas de Ahorro USD',
    currency: 'USD',
    balance: 1.21,
    accountNumber: '19301908973153',
  },
  {
    name: 'Mercantil Cta. Corriente',
    currency: 'BS',
    balance: 348.36,
    accountNumber: '01050020641020656670',
  },
  {
    name: 'BDV Cuenta Corriente',
    currency: 'BS',
    balance: 95.68,
    accountNumber: '01020727440000259550',
  },
  {
    name: 'Binance USDT',
    currency: 'USD',
    balance: 324.29,
    accountNumber: '',
  },
];

(async () => {
  console.log('🔧 Iniciando importación de cuentas desde Node...');
  try {
    // Para no duplicar, leemos las cuentas que ya existen
    const accountsCol = collection(dbNode, 'accounts');
    // Necesitamos el userId del owner
    // Leemos el config/owner
    const { doc, getDoc } = await import('firebase/firestore/lite');
    const ownerSnap = await getDoc(doc(dbNode, "config", "owner"));
    const userId = ownerSnap.exists() ? ownerSnap.data().uid : null;

    if (!userId) {
      console.error('❌ No se encontró el userId en config/owner. Abre la app web primero para inicializarlo.');
      return;
    }

    const { getDocs } = await import('firebase/firestore/lite');
    const existingSnap = await getDocs(accountsCol);
    const existingNames = existingSnap.docs.map(d => d.data().name);

    for (const c of cuentas) {
      if (existingNames.includes(c.name)) {
        console.log(`⚠️ La cuenta "${c.name}" ya existe. Saltando...`);
        continue;
      }
      await addDoc(accountsCol, {
        name: c.name,
        currency: c.currency,
        balance: c.balance,
        accountNumber: c.accountNumber,
        userId: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log(`✅ ${c.name} importada.`);
    }
    console.log('🎉 Proceso de importación finalizado.');
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
