import { dbNode } from '../../api/_firebaseNode.js';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore/lite';

(async () => {
  console.log('🔧 Leyendo logs de consumo...');
  try {
    const q = query(collection(dbNode, 'api_usage'), orderBy('createdAt', 'desc'), limit(5));
    const snap = await getDocs(q);
    snap.forEach(doc => {
      const d = doc.data();
      console.log(`- Date: ${d.createdAt} | Cost: ${d.cost} | Source: ${d.source} | Prompt: ${d.promptPreview}`);
    });
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
