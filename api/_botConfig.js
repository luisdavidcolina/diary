// Carga la configuración del bot (identidad/personalidad/reglas) y sus bases de
// conocimiento desde Firestore, para que sean editables desde la web sin tocar código.
// El prefijo "_" evita que Vercel lo cuente como función serverless.

import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore/lite";
import { dbNode } from "./_firebaseNode.js";

// Carga config/bot + las entradas de bot_knowledge marcadas como "siempre presentes".
// `ownerUid` es opcional (app de un solo usuario): si viene, filtra por él.
export async function loadBotBrain(ownerUid = null) {
  let config = {};
  let knowledge = [];

  try {
    const snap = await getDoc(doc(dbNode, "config", "bot"));
    if (snap.exists()) config = snap.data() || {};
  } catch (e) {
    console.error("loadBotBrain config error", e);
  }

  try {
    const ref = ownerUid
      ? query(collection(dbNode, "bot_knowledge"), where("userId", "==", ownerUid))
      : collection(dbNode, "bot_knowledge");
    const snap = await getDocs(ref);
    snap.forEach((d) => {
      const v = d.data();
      // `always !== false` → por defecto se inyecta; desmarcarlo lo deja solo bajo demanda.
      if (v && v.always !== false && v.title) knowledge.push({ title: v.title, content: v.content || '' });
    });
  } catch (e) {
    console.error("loadBotBrain knowledge error", e);
  }

  return { config, knowledge };
}
