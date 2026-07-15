import { doc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore/lite";
import { dbNode } from "./_firebaseNode.js";

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendTelegramMessage(chatId, text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
  });
}

async function answerCallbackQuery(callbackQueryId, text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text })
  });
}

async function editMessageText(chatId, messageId, text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/editMessageText`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, parse_mode: 'Markdown' })
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('OK');

  const update = req.body;

  try {
    // 1. Manejar Botones (Callback Queries)
    if (update.callback_query) {
      const cb = update.callback_query;
      const data = cb.data;
      const chatId = cb.message.chat.id;
      const messageId = cb.message.message_id;

      if (data.startsWith('complete_')) {
        const taskId = data.split('_')[1];
        await updateDoc(doc(dbNode, "lifestyle", taskId), { isCompleted: true });
        
        await answerCallbackQuery(cb.id, "¡Tarea Completada!");
        await editMessageText(chatId, messageId, "✅ *Tarea Completada*");
      } 
      else if (data.startsWith('snooze_')) {
        const taskId = data.split('_')[1];
        
        // Calcular tiempo dentro de 1 hora
        const targetDate = new Date();
        targetDate.setHours(targetDate.getHours() + 1);
        const notBefore = Math.floor(targetDate.getTime() / 1000);

        const appUrl = `https://${req.headers.host}`; 
        const qstashUrl = `${process.env.QSTASH_URL || 'https://qstash.upstash.io'}/v2/publish/${appUrl}/api/send-exact-reminder`;
        
        await fetch(qstashUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.QSTASH_TOKEN}`,
            'Content-Type': 'application/json',
            'Upstash-Not-Before': notBefore.toString()
          },
          body: JSON.stringify({ id: taskId, title: "Recordatorio Pospuesto" })
        });

        await answerCallbackQuery(cb.id, "Pospuesto 1 hora");
        await editMessageText(chatId, messageId, "⏳ *Pospuesto 1 hora*");
      }
      return res.status(200).send('OK');
    }

    // 2. Manejar Mensajes de Texto (Comandos)
    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      
      // Asegurar que solo el dueño puede interactuar
      if (chatId.toString() !== process.env.TELEGRAM_CHAT_ID) {
        return res.status(200).send('OK');
      }

      let responseText = "✅ Guardado en Captura Rápida";

      if (text.startsWith('/gasto ')) {
        const parts = text.replace('/gasto ', '').split(' ');
        const amount = parseFloat(parts[0]);
        const title = parts.slice(1).join(' ');
        
        await addDoc(collection(dbNode, "finance"), {
          type: 'expense',
          amount: amount,
          title: title || 'Gasto Telegram',
          category: 'Varios',
          date: new Date().toISOString().split('T')[0],
          createdAt: serverTimestamp()
        });
        responseText = `💸 Gasto de $${amount} registrado.`;
      } 
      else if (text.startsWith('/ingreso ')) {
        const parts = text.replace('/ingreso ', '').split(' ');
        const amount = parseFloat(parts[0]);
        const title = parts.slice(1).join(' ');
        
        await addDoc(collection(dbNode, "finance"), {
          type: 'income',
          amount: amount,
          title: title || 'Ingreso Telegram',
          category: 'Varios',
          date: new Date().toISOString().split('T')[0],
          createdAt: serverTimestamp()
        });
        responseText = `💰 Ingreso de $${amount} registrado.`;
      }
      else if (text.startsWith('/diario ')) {
        const content = text.replace('/diario ', '');
        await addDoc(collection(dbNode, "diary"), {
          title: "Entrada desde Telegram",
          content: content,
          date: new Date().toISOString(),
          createdAt: serverTimestamp()
        });
        responseText = `📖 Entrada de diario guardada.`;
      }
      else {
        // Captura rápida: Tarea
        const title = text.replace('/tarea ', '');
        await addDoc(collection(dbNode, "lifestyle"), {
          title: title,
          category: 'task',
          isCompleted: false,
          createdAt: serverTimestamp()
        });
      }

      await sendTelegramMessage(chatId, responseText);
      return res.status(200).send('OK');
    }

  } catch (error) {
    console.error("Webhook Error:", error);
  }

  // Siempre devolver 200 para que Telegram no reintente
  res.status(200).send('OK');
}
