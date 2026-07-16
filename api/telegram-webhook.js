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

// Llama a OpenRouter (Economizado: 1 sola llamada, resuelve herramientas aquí mismo)
async function processTextWithAI(text, chatId, reqHost) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return "⚠️ Falta OPENROUTER_API_KEY en el servidor.";

  const systemPrompt = `Eres un asistente de Telegram.
El usuario te enviará mensajes cortos (ideas, tareas, gastos, anécdotas).
Si el mensaje es para agregar una tarea pendiente o recordatorio genérico, usa add_task.
Si es sobre un gasto o dinero, usa add_transaction.
Si es un pensamiento o algo para el diario personal, usa add_diary_entry.
Si solo está saludando o haciendo una pregunta general, responde cortamente y amigable (usa emojis).`;

  const tools = [
    {
      type: "function",
      function: {
        name: "add_task",
        description: "Agrega una tarea pendiente a la lista de tareas (Captura Rápida).",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "El título de la tarea" }
          },
          required: ["title"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "add_transaction",
        description: "Registra un gasto o ingreso.",
        parameters: {
          type: "object",
          properties: {
            amount: { type: "number", description: "El monto" },
            description: { type: "string", description: "Descripción" },
            type: { type: "string", description: "'expense' o 'income'" }
          },
          required: ["amount", "description", "type"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "add_diary_entry",
        description: "Añade una entrada al diario personal.",
        parameters: {
          type: "object",
          properties: {
            text: { type: "string", description: "El texto del diario" }
          },
          required: ["text"]
        }
      }
    }
  ];

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        tools: tools,
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message || "Error en OpenRouter");

    const responseMsg = data.choices[0].message;

    // Si la IA decidió usar una herramienta
    if (responseMsg.tool_calls && responseMsg.tool_calls.length > 0) {
      const tool = responseMsg.tool_calls[0].function;
      const args = JSON.parse(tool.arguments);

      if (tool.name === 'add_task') {
        await addDoc(collection(dbNode, "lifestyle"), {
          title: args.title,
          category: 'task',
          isCompleted: false,
          createdAt: serverTimestamp()
        });
        return `✅ Tarea guardada: *${args.title}*`;
      } 
      
      if (tool.name === 'add_transaction') {
        await addDoc(collection(dbNode, "finance"), {
          type: args.type,
          amount: args.amount,
          title: args.description,
          category: 'other',
          date: new Date().toISOString().split('T')[0],
          createdAt: serverTimestamp()
        });
        const emoji = args.type === 'expense' ? '💸' : '💰';
        return `${emoji} Transacción guardada: *$${args.amount}* (${args.description})`;
      }

      if (tool.name === 'add_diary_entry') {
        await addDoc(collection(dbNode, "diary"), {
          title: "Entrada desde Telegram",
          content: args.text,
          date: new Date().toISOString(),
          createdAt: serverTimestamp()
        });
        return `📖 Diario actualizado exitosamente.`;
      }
    }

    // Si no usó herramientas, devolver el texto natural que generó
    return responseMsg.content;

  } catch (error) {
    console.error("AI Error:", error);
    return "⚠️ Hubo un error al pensar la respuesta.";
  }
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

    // 2. Manejar Mensajes de Texto o Fotos
    if (update.message) {
      const chatId = update.message.chat.id;

      // Asegurar que solo el dueño puede interactuar
      if (chatId.toString() !== process.env.TELEGRAM_CHAT_ID) {
        return res.status(200).send('OK');
      }

      // Procesar Fotos (Comprobantes)
      if (update.message.photo) {
        await sendTelegramMessage(chatId, "⏳ Procesando comprobante con IA...");
        const photos = update.message.photo;
        const fileId = photos[photos.length - 1].file_id; 
        
        try {
          const tgFileRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${fileId}`);
          const tgFileData = await tgFileRes.json();
          if (!tgFileData.ok) throw new Error("Telegram API error");
          
          const filePath = tgFileData.result.file_path;
          const tgFileUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${filePath}`;
          
          const appUrl = `https://${req.headers.host}`;
          const ocrRes = await fetch(`${appUrl}/api/process-receipt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: tgFileUrl })
          });
          
          const ocrData = await ocrRes.json();
          if (ocrData.success) {
            const { amount, date, description, type } = ocrData.data;
            await addDoc(collection(dbNode, "finance"), {
              type: type || 'expense',
              amount: parseFloat(amount) || 0,
              title: description || 'Gasto de comprobante',
              category: 'other',
              date: date || new Date().toISOString().split('T')[0],
              telegramFileId: fileId,
              createdAt: serverTimestamp()
            });
            await sendTelegramMessage(chatId, `✅ *Comprobante procesado:*\nMonto: $${amount}\\nConcepto: ${description}\\nGuardado en Finanzas.`);
          } else {
            await sendTelegramMessage(chatId, `⚠️ Error en IA: ${ocrData.error}`);
          }
        } catch (e) {
          console.error(e);
          await sendTelegramMessage(chatId, `⚠️ Hubo un problema procesando la imagen.`);
        }
        return res.status(200).send('OK');
      }

      if (!update.message.text) {
        await sendTelegramMessage(chatId, "⚠️ Todavía no tengo oídos, por favor escríbeme en texto o envíame una foto de comprobante.");
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
\`/diario [texto]\` - Ej: \`/diario Hoy fue un gran día...\`

*🤖 IA:*
\`/creditos\` - Muestra el saldo consumido de la API\``;
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
      else if (text.startsWith('/creditos')) {
        const appUrl = `https://${req.headers.host}`;
        try {
          const credRes = await fetch(`${appUrl}/api/get-credits`);
          const credData = await credRes.json();
          if (credData.error) {
            responseText = `⚠️ Error leyendo créditos: ${credData.error}`;
          } else {
            responseText = `📊 *Consumo de API (IA):*\nHas gastado $${credData.usage}`;
          }
        } catch (e) {
          responseText = `⚠️ Error de conexión al consultar saldo.`;
        }
      }
      else {
        // Enviar mensaje temporal y obtener su message_id
        const tempMsgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: "⏳ Pensando...", parse_mode: 'Markdown' })
        });
        
        let tempMsgId = null;
        if (tempMsgRes.ok) {
          const tempMsgData = await tempMsgRes.json();
          tempMsgId = tempMsgData.result.message_id;
        }

        // Procesar con IA
        const aiResponse = await processTextWithAI(text, chatId, req.headers.host);

        if (tempMsgId) {
          await editMessageText(chatId, tempMsgId, aiResponse);
        } else {
          await sendTelegramMessage(chatId, aiResponse);
        }
        return res.status(200).send('OK');
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
