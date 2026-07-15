import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";

export default async function handler(req, res) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return res.status(500).json({ error: "Faltan credenciales de Telegram" });
  }

  // Configuración de Firebase leída del entorno (Vercel)
  const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
  };

  try {
    // Evitar reinicializar Firebase en cada llamada si el worker de Vercel sigue vivo
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const db = getFirestore(app);

    // Buscar tareas no completadas en la colección "lifestyle"
    const q = query(collection(db, "lifestyle"), where("isCompleted", "==", false));
    const snap = await getDocs(q);
    
    // Ajuste a zona horaria de Venezuela (UTC-4) para el cron diario
    const now = new Date();
    now.setHours(now.getHours() - 4);
    const today = now.toISOString().split('T')[0];
    
    let pendingTasks = [];
    snap.forEach((doc) => {
      const data = doc.data();
      if (data.category === 'task') {
        if (!data.reminderDate || data.reminderDate === today) {
          pendingTasks.push(data.title + (data.reminderTime ? ` (a las ${data.reminderTime})` : ''));
        }
      }
    });

    // Si no hay tareas, no hacemos spam por Telegram
    if (pendingTasks.length === 0) {
      return res.status(200).json({ success: true, message: "No hay tareas pendientes. No se envió mensaje." });
    }

    // Formatear el mensaje bonito
    const message = `🚨 *Recordatorio de tu Diario* 🚨\n\n¡No te olvides! Tienes ${pendingTasks.length} tareas pendientes:\n\n${pendingTasks.map(t => `• ${t}`).join('\n')}`;

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      }),
    });

    const data = await response.json();
    
    if (data.ok) {
      return res.status(200).json({ success: true, message: "Recordatorios enviados exitosamente" });
    } else {
      return res.status(500).json({ success: false, error: data.description });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
