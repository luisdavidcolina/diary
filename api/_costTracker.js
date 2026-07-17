import { collection, addDoc, getDocs, query, where } from "firebase/firestore/lite";
import { dbNode } from "./_firebaseNode.js";

const DAILY_LIMIT = 5.00; // $5.00

export async function checkDailyLimit() {
  const today = new Date().toISOString().split('T')[0];
  const q = query(collection(dbNode, "api_usage"), where("date", "==", today));
  const snap = await getDocs(q);
  let totalCost = 0;
  snap.forEach(doc => {
    totalCost += doc.data().cost || 0;
  });
  
  if (totalCost >= DAILY_LIMIT) {
    return { 
      allowed: false, 
      total: totalCost, 
      limit: DAILY_LIMIT, 
      message: `Límite diario de gasto alcanzado ($${totalCost.toFixed(3)} / $${DAILY_LIMIT}). Vuelve mañana.`
    };
  }
  return { allowed: true, total: totalCost, limit: DAILY_LIMIT };
}

// meta.model: sin él solo queda un promedio que mezcla modelos y no compara nada.
// meta.sessionId: atribuye el costo a una conversación concreta.
export async function logApiCost(cost, source, usage = null, promptPreview = null, meta = {}) {
  if (!cost || cost <= 0) return;
  const today = new Date().toISOString().split('T')[0];
  const payload = {
    cost: parseFloat(cost),
    source,
    date: today,
    createdAt: new Date().toISOString()
  };

  if (meta.model) payload.model = String(meta.model);
  if (meta.sessionId) payload.sessionId = String(meta.sessionId);
  
  if (usage) {
    payload.prompt_tokens = usage.prompt_tokens || 0;
    payload.completion_tokens = usage.completion_tokens || 0;
    payload.total_tokens = usage.total_tokens || 0;
  }
  if (promptPreview) {
    payload.promptPreview = String(promptPreview).slice(0, 100);
  }

  await addDoc(collection(dbNode, "api_usage"), payload);
}
