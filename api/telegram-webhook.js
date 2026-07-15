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

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET || "diary_secret_2026";
  if (req.headers['x-telegram-bot-api-secret-token'] !== secret) {
    return res.status(403).send('Forbidden');
  }

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
    if (update.message) {
      const chatId = update.message.chat.id;

      // Asegurar que solo el dueño puede interactuar
      if (chatId.toString() !== process.env.TELEGRAM_CHAT_ID) {
        return res.status(200).send('OK');
      }

      if (!update.message.text) {
        await sendTelegramMessage(chatId, "⚠️ Todavía no tengo oídos ni ojos, por favor escríbeme en texto.");
        return res.status(200).send('OK');
      }

      const text = update.message.text;

      let responseText = "✅ Guardado en Captura Rápida";

      if (text.startsWith('/start') || text.startsWith('/help')) {
        responseText = `🤖 *Guía Rápida de Comandos:*

*📝 Captura Rápida:*
Escribe cualquier mensaje normal (sin la barra /) para agregarlo como una tarea pendiente.

*⏰ Recordatorios:*
\`/recordar HH:MM [texto]\`
Ejemplo: \`/recordar 15:30 Llamar al banco\`

*💸 Finanzas:*
\`/gasto [monto] [concepto]\` - Ej: \`/gasto 10 Cine\`
\`/ingreso [monto] [concepto]\` - Ej: \`/ingreso 500 Sueldo\`

*📖 Diario:*
\`/diario [texto]\` - Ej: \`/diario Hoy fue un gran día...\``;
      }
      else if (text.startsWith('/recordar ')) {
        const rawCommand = text.replace('/recordar ', '').trim();
        const parts = rawCommand.split(' ');
        
        let dateStr, timeStr, titleStartIndex;
        let isDaily = false;
        
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const timeRegex = /^\d{1,2}:\d{2}$/;

        if (parts[0].toLowerCase() === 'diario' && timeRegex.test(parts[1])) {
          isDaily = true;
          timeStr = parts[1];
          titleStartIndex = 2;
        } else if (dateRegex.test(parts[0]) && timeRegex.test(parts[1])) {
          dateStr = parts[0];
          timeStr = parts[1];
          titleStartIndex = 2;
        } else if (timeRegex.test(parts[0])) {
          timeStr = parts[0];
          titleStartIndex = 1;
          
          // Fecha inteligente (mañana si ya pasó)
          const nowUtc4 = new Date(new Date().getTime() - (4 * 60 * 60 * 1000));
          const [hours, minutes] = timeStr.split(':').map(Number);
          const targetUtc4 = new Date(nowUtc4);
          targetUtc4.setHours(hours, minutes, 0, 0);

          if (targetUtc4 < nowUtc4) {
            targetUtc4.setDate(targetUtc4.getDate() + 1); // Mañana
          }
          dateStr = targetUtc4.toISOString().split('T')[0];
        } else {
          await sendTelegramMessage(chatId, "⚠️ Formato inválido.\\nEjemplos:\\n`/recordar 15:30 Tarea`\\n`/recordar 2026-07-20 15:30 Tarea`\\n`/recordar diario 15:30 Tarea`");
          return res.status(200).send('OK');
        }

        timeStr = timeStr.padStart(5, '0');
        const title = parts.slice(titleStartIndex).join(' ') || 'Recordatorio Telegram';
        
        const docRef = await addDoc(collection(dbNode, "lifestyle"), {
          title: title,
          category: 'task',
          isCompleted: false,
          createdAt: serverTimestamp()
        });

        const appUrl = `https://${req.headers.host}`;
        const endpoint = isDaily ? '/api/schedule-recurring-reminder' : '/api/schedule-exact-reminder';
        const bodyPayload = isDaily 
          ? { id: docRef.id, title: title, time: timeStr }
          : { id: docRef.id, title: title, date: dateStr, time: timeStr };

        try {
          const schedRes = await fetch(`${appUrl}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyPayload)
          });
          
          if (schedRes.ok) {
            const schedData = await schedRes.json();
            const reminderId = isDaily ? schedData.scheduleId : schedData.messageId;
            if (reminderId) {
              await updateDoc(doc(dbNode, "lifestyle", docRef.id), { reminderId: reminderId, isRecurring: isDaily });
            }
            const dateStrMsg = isDaily ? 'todos los días' : (dateStr ? `el ${dateStr}` : 'hoy/mañana');
            responseText = `⏰ Recordatorio "${title}" programado para ${dateStrMsg} a las ${timeStr}.`;
          } else {
            responseText = `⚠️ Tarea guardada, pero la hora falló. Revisa el formato (ej. 15:30).`;
          }
        } catch (e) {
          responseText = `⚠️ Tarea guardada, pero hubo un error de conexión al programar.`;
        }
      }
      else if (text.startsWith('/gasto ')) {
        const parts = text.replace('/gasto ', '').split(' ');
        const amount = parseFloat(parts[0]);
        const title = parts.slice(1).join(' ');
        
        await addDoc(collection(dbNode, "finance"), {
          type: 'expense',
          amount: amount,
          title: title || 'Gasto Telegram',
          category: 'other',
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
        const title = text.startsWith('/tarea ') ? text.replace('/tarea ', '') : text;
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
