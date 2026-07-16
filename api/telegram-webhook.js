import { doc, getDoc, updateDoc, deleteDoc, collection, addDoc, getDocs, query, where } from "firebase/firestore/lite";
import { dbNode } from "./_firebaseNode.js";
import { checkDailyLimit, logApiCost } from "./_costTracker.js";
import { buildSystemPrompt } from "./_context.js";
import { loadBotBrain } from "./_botConfig.js";

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// UID del dueño (app single-user). La app web filtra TODO por userId, así que los
// datos de Telegram deben llevarlo. Se resuelve automáticamente desde config/owner
// (lo escribe la web al abrir el Dashboard); OWNER_UID en Vercel es un override opcional.
let OWNER_UID = process.env.OWNER_UID || null;

async function resolveOwnerUid() {
  if (OWNER_UID) return OWNER_UID;
  try {
    const snap = await getDoc(doc(dbNode, "config", "owner"));
    if (snap.exists()) OWNER_UID = snap.data().uid || null;
  } catch (e) {
    console.error("resolveOwnerUid error", e);
  }
  return OWNER_UID;
}
const nowIso = () => new Date().toISOString();

// Escrituras unificadas con la app web (mismas colecciones y esquema que src/services/db.js).
async function saveTransaction({ amount, description, type, category = 'other', currency = 'USD', rate = null, receiptUrl = null }) {
  const amt = parseFloat(amount) || 0;
  const amountUSD = currency === 'VES' && rate ? amt / parseFloat(rate) : amt;
  const payload = {
    userId: OWNER_UID, amount: amt, currency, description, type, category,
    amountUSD: Number(amountUSD.toFixed(2)), createdAt: nowIso()
  };
  if (rate) payload.rate = parseFloat(rate);
  if (receiptUrl) payload.receiptUrl = receiptUrl;
  return addDoc(collection(dbNode, "transactions"), payload);
}
async function saveJournal(content) {
  return addDoc(collection(dbNode, "journal_entries"), { userId: OWNER_UID, content, mood: 'neutral', createdAt: nowIso() });
}
async function saveTask(title, extra = {}) {
  return addDoc(collection(dbNode, "lifestyle"), { userId: OWNER_UID, title, category: 'task', isCompleted: false, createdAt: nowIso(), ...extra });
}

// Lectura scopeada por usuario (para comandos de consulta que NO gastan tokens de IA).
async function readMine(coll) {
  const ref = OWNER_UID
    ? query(collection(dbNode, coll), where("userId", "==", OWNER_UID))
    : collection(dbNode, coll);
  const snap = await getDocs(ref);
  const out = [];
  snap.forEach((d) => out.push({ id: d.id, ...d.data() }));
  return out;
}
const usd = (t) => (t.amountUSD != null ? t.amountUSD : parseFloat(t.amount) || 0);
const isThisMonth = (iso) => {
  const d = new Date(iso); const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth();
};

async function sendTelegramMessage(chatId, text, replyMarkup = null) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  const body = { chat_id: chatId, text, parse_mode: 'Markdown' };
  if (replyMarkup) body.reply_markup = replyMarkup;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
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

async function editMessageText(chatId, messageId, text, replyMarkup = null) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/editMessageText`;
  const body = { chat_id: chatId, message_id: messageId, text, parse_mode: 'Markdown' };
  if (replyMarkup) body.reply_markup = replyMarkup;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

// Llama a OpenRouter (Economizado: 1 sola llamada, resuelve herramientas aquí mismo)
// Segunda pasada: le devuelve a la IA el resultado de una herramienta de LECTURA
// para que responda en lenguaje natural (como hace el chat web), en vez de volcar
// datos crudos. Solo se usa en consultas (get_docs_list, read_doc_file).
async function summarizeToolResult(apiKey, systemPrompt, userText, toolCall, toolResult) {
  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        temperature: 0.5,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userText },
          { role: 'assistant', content: null, tool_calls: [{ id: 'call_1', type: 'function', function: { name: toolCall.name, arguments: toolCall.arguments } }] },
          { role: 'tool', tool_call_id: 'call_1', name: toolCall.name, content: String(toolResult).slice(0, 6000) }
        ]
      })
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d?.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

async function processTextWithAI(text, chatId, reqHost) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return "⚠️ Falta OPENROUTER_API_KEY en el servidor.";

  const limitStatus = await checkDailyLimit();
  if (!limitStatus.allowed) {
    return { text: `⚠️ ${limitStatus.message}` };
  }

  const nowCaracas = new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" });
  // Cerebro editable desde la web (identidad, personalidad, reglas, conocimiento).
  const brain = await loadBotBrain(OWNER_UID);
  const systemPrompt = `${buildSystemPrompt({
    config: brain.config,
    knowledge: brain.knowledge,
    surface: 'Estás respondiendo por Telegram (mensajes cortos).',
    now: nowCaracas
  })}

REGLAS OPERATIVAS (prioridad alta):
- Si el mensaje pide un RECORDATORIO, ALARMA o AVISO con una HORA (ej. "recuérdame báñate a las 21:29", "avísame mañana 8am"), usa SIEMPRE schedule_reminder con esa hora. NO uses add_task en ese caso.
  · Si dice "hoy" o no da fecha, deja date vacío. Si dice "todos los días", pon isRecurring=true.
  · La hora debe ir en formato HH:MM de 24 horas (21:29, 08:00).
- Si es una tarea pendiente SIN hora concreta, usa add_task.
- Si es sobre un gasto o dinero, usa add_transaction.
- Si es un pensamiento o algo para el diario personal, usa add_diary_entry.
- Para LEER/consultar datos o hallar el 'id' de un registro, usa db_query. Para MODIFICAR/corregir, db_update. Para BORRAR, db_delete.
  Colecciones: transactions (finanzas), journal_entries (diario), lifestyle (tareas/hábitos: title, isCompleted), accounts (cuentas: name, currency, balance, accountNumber), library_items (biblioteca).
  Completar una tarea = db_update en 'lifestyle' con { isCompleted: true }.
- Si pregunta por sus MATERIAS, TEMAS o temario (ej. "temas de cálculo"), consulta la colección 'syllabus' con db_query (tiene TODO el temario: materia, unidad y subtema). Para otros materiales/documentos usa get_docs_list/read_doc_file. NUNCA inventes materias ni temas.
- Si solo saluda o hace una pregunta general, responde corto y amigable (usa emojis).`;

  const tools = [
    {
      type: "function",
      function: {
        name: "add_task",
        description: "Agrega una tarea pendiente SIN hora a la lista (Captura Rápida). Si el usuario menciona una hora o pide un aviso/alarma, NO uses esta: usa schedule_reminder.",
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
    },
    {
      type: "function",
      function: {
        name: "schedule_reminder",
        description: "Programa un recordatorio/alarma que ENVIARÁ un aviso por Telegram a una hora concreta. Úsala SIEMPRE que el usuario mencione una hora (ej. 'a las 21:29').",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Título del recordatorio" },
            date: { type: "string", description: "Fecha en formato YYYY-MM-DD. Dejar vacío si es recurrente diario o si es explícitamente para hoy." },
            time: { type: "string", description: "Hora en formato HH:MM (24 horas)" },
            isRecurring: { type: "boolean", description: "True si debe repetirse todos los días a esa hora" }
          },
          required: ["title", "time"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "db_query",
        description: "Lee/consulta registros de cualquier colección. Úsala para revisar datos o para obtener el 'id' antes de modificar o borrar.",
        parameters: {
          type: "object",
          properties: {
            collection: { type: "string", description: "'transactions', 'journal_entries', 'lifestyle', 'accounts' o 'library_items'" },
            limit: { type: "number", description: "Cuántos registros recientes (por defecto 8)" }
          },
          required: ["collection"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "db_update",
        description: "Modifica/corrige un registro. Primero usa db_query para su 'id'. En 'data' van solo los campos a cambiar.",
        parameters: {
          type: "object",
          properties: {
            collection: { type: "string", description: "'transactions', 'journal_entries', 'lifestyle', 'accounts' o 'library_items'" },
            id: { type: "string", description: "id del registro" },
            data: { type: "object", description: "Campos a actualizar" }
          },
          required: ["collection", "id", "data"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "db_delete",
        description: "Elimina un registro. Primero usa db_query para su 'id'.",
        parameters: {
          type: "object",
          properties: {
            collection: { type: "string", description: "'transactions', 'journal_entries', 'lifestyle', 'accounts' o 'library_items'" },
            id: { type: "string", description: "id del registro" }
          },
          required: ["collection", "id"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "get_docs_list",
        description: "Lista los documentos y materiales de estudio del usuario (materias, temarios, plan de estudio, apuntes). Úsala cuando pregunte por sus materias, temas o qué está estudiando.",
        parameters: { type: "object", properties: {} }
      }
    },
    {
      type: "function",
      function: {
        name: "read_doc_file",
        description: "Lee el contenido de un documento/material concreto (ej. 'PLAN_ESTUDIO.md'). Úsala tras get_docs_list para responder sobre el contenido.",
        parameters: {
          type: "object",
          properties: {
            filepath: { type: "string", description: "Ruta del archivo, ej. 'PLAN_ESTUDIO.md' o 'ingles/guia.pdf'" }
          },
          required: ["filepath"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "get_exchange_rates",
        description: "Consulta y devuelve las tasas de cambio actuales del dólar en Venezuela (BCV y Paralelo). Úsala cuando el usuario pregunte por el precio del dólar, tasas, BCV o paralelo.",
        parameters: { type: "object", properties: {} }
      }
    }
  ];

  // Refuerzo determinista: si hay clara intención de recordatorio + una hora,
  // FORZAMOS schedule_reminder (el modelo a veces elige add_task por error).
  const reminderIntent = /\b(recu[eé]rda|record[aá]|av[ií]sa|al[aá]rma|recordatorio)/i.test(text);
  const hasTimeish = /\b\d{1,2}[:\s.hH]\d{2}\b|\ba las\b|\b\d{1,2}\s?(am|pm)\b/i.test(text);
  const forceReminder = reminderIntent && hasTimeish;

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
        tool_choice: forceReminder
          ? { type: 'function', function: { name: 'schedule_reminder' } }
          : 'auto',
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`OpenRouter ${response.status}: ${errText.slice(0, 150)}`);
    }

    const data = await response.json();
    if (data.error) throw new Error(data.error.message || "Error en OpenRouter");

    if (data.usage && data.usage.cost) {
      await logApiCost(data.usage.cost, 'telegram');
    }

    const responseMsg = data?.choices?.[0]?.message;
    if (!responseMsg) throw new Error("La IA no devolvió respuesta.");

    // Si la IA decidió usar una herramienta
    if (responseMsg.tool_calls && responseMsg.tool_calls.length > 0) {
      const tool = responseMsg.tool_calls[0].function;
      const args = JSON.parse(tool.arguments);

      const modifyingTools = ['add_task', 'add_transaction', 'add_diary_entry', 'schedule_reminder', 'db_update', 'db_delete'];
      if (modifyingTools.includes(tool.name)) {
        // En lugar de ejecutar, guardamos la propuesta en Firebase
        const proposalPayload = {
          userId: OWNER_UID,
          toolName: tool.name,
          toolArgs: args,
          createdAt: new Date().toISOString()
        };
        const docRef = await addDoc(collection(dbNode, "telegram_proposals"), proposalPayload);
        
        const replyMarkup = {
          inline_keyboard: [
            [
              { text: "✅ Aprobar", callback_data: `approve_${docRef.id}` },
              { text: "❌ Rechazar", callback_data: `reject_${docRef.id}` }
            ]
          ]
        };
        return { 
          text: `La IA propone ejecutar la acción: *${tool.name}*.\n¿Deseas proceder?`, 
          replyMarkup 
        };
      }

      if (tool.name === 'add_task') {
        await saveTask(args.title);
        return `✅ Tarea guardada: *${args.title}*`;
      }

      if (tool.name === 'add_transaction') {
        await saveTransaction({ amount: args.amount, description: args.description, type: args.type });
        const emoji = args.type === 'expense' ? '💸' : '💰';
        return `${emoji} Transacción guardada: *$${args.amount}* (${args.description})`;
      }

      if (tool.name === 'add_diary_entry') {
        await saveJournal(args.text);
        return `📖 Diario actualizado exitosamente.`;
      }

      if (tool.name === 'schedule_reminder') {
        const dbDate = args.date || new Date().toISOString().split('T')[0];

        // 1. Save Task (con fecha/hora para que salga en el tablero "Por Hacer" de la web)
        const docRef = await saveTask(args.title, {
          reminderDate: dbDate,
          reminderTime: args.time,
          isRecurring: !!args.isRecurring
        });

        // 2. Schedule
        const endpoint = args.isRecurring ? '/api/reminders?action=schedule-recurring' : '/api/reminders?action=schedule-exact';
        const bodyPayload = args.isRecurring 
          ? { id: docRef.id, title: args.title, time: args.time }
          : { id: docRef.id, title: args.title, date: dbDate, time: args.time };
        
        const schedRes = await fetch(`https://${reqHost}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload)
        });

        if (schedRes.ok) {
          const schedData = await schedRes.json();
          if (schedData.success === false) {
            return schedData.noQstash
              ? `⚠️ Guardé "${args.title}" como tarea, pero el AVISO no se pudo agendar: falta configurar *QSTASH_TOKEN* en el servidor (Vercel).`
              : `⚠️ Guardé la tarea, pero falló el aviso: ${schedData.error || 'error del servidor'}.`;
          }
          const reminderId = args.isRecurring ? schedData.scheduleId : schedData.messageId;
          if (reminderId) {
            await updateDoc(doc(dbNode, "lifestyle", docRef.id), { reminderId, isRecurring: args.isRecurring || false });
          }
          return `⏰ Recordatorio "${args.title}" programado para las ${args.time}`;
        }
        return `⚠️ Tarea guardada, pero hubo un error programando la alarma del servidor.`;
      }

      // CRUD genérico sobre la BD. (solo lecturas)
      const AI_COLLECTIONS = ['transactions', 'journal_entries', 'lifestyle', 'accounts', 'library_items', 'syllabus'];
      if (tool.name === 'db_query') {
        if (!AI_COLLECTIONS.includes(args.collection)) return { text: `⚠️ Colección no permitida.` };
        const rows = (await readMine(args.collection))
          .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
          .slice(0, args.limit || (args.collection === 'syllabus' ? 100 : 8));
        if (!rows.length) {
          if (args.collection === 'syllabus') {
            const dr = await fetch(`https://${reqHost}/api/read-doc?filepath=PLAN_ESTUDIO.md`);
            const dd = await dr.json();
            if (dd.content) {
              const s = await summarizeToolResult(apiKey, systemPrompt, text, tool, dd.content);
              if (s) return { text: s };
            }
          }
          return { text: `No hay registros en ${args.collection}.` };
        }
        const summary = await summarizeToolResult(apiKey, systemPrompt, text, tool, JSON.stringify(rows));
        return { text: summary || `📋 ${args.collection}:\n${rows.map((r) => `• ${r.description || r.title || r.content || r.name || r.id}${r.amount != null ? ` ($${r.amount})` : ''} [id: ${r.id}]`).join('\n')}` };
      }

      if (tool.name === 'get_docs_list') {
        const r = await fetch(`https://${reqHost}/api/read-doc`);
        const d = await r.json();
        const result = JSON.stringify(d.files || d.error || []);
        const summary = await summarizeToolResult(apiKey, systemPrompt, text, tool, result);
        return { text: summary || `📚 Documentos:\n${(d.files || []).map((f) => `• ${f}`).join('\n')}` };
      }
      if (tool.name === 'read_doc_file') {
        const r = await fetch(`https://${reqHost}/api/read-doc?filepath=${encodeURIComponent(args.filepath)}`);
        const dd = await r.json();
        const result = dd.content || dd.error || 'No se pudo leer el archivo.';
        const summary = await summarizeToolResult(apiKey, systemPrompt, text, tool, dd.content || "Error leyendo");
        return { text: summary || (dd.content ? dd.content.slice(0, 1000) : "No se pudo leer.") };
      }

      if (tool.name === 'get_exchange_rates') {
        try {
          const r = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar');
          const d = await r.json();
          const bcv = d.monitors.bcv.price;
          const paralelo = d.monitors.enparalelovzla.price;
          const resultText = `Tasas de cambio actuales: BCV (Bs. ${bcv}), Paralelo (Bs. ${paralelo})`;
          const summary = await summarizeToolResult(apiKey, systemPrompt, text, tool, resultText);
          return { text: summary || resultText };
        } catch (e) {
          return { text: "No se pudieron obtener las tasas de cambio en este momento." };
        }
      }

      return { text: `Herramienta desconocida solicitada: ${tool.name}` };
    }

    return { text: responseMsg.content };

  } catch (error) {
    console.error("AI Error:", error);
    return { text: "⚠️ Hubo un error al pensar la respuesta." };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('OK');

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET || "diary_secret_2026";
  if (req.headers['x-telegram-bot-api-secret-token'] !== secret) {
    return res.status(403).send('Forbidden');
  }

  const update = req.body;

  // Resolver el uid del dueño (auto, desde config/owner) para scopear los datos.
  await resolveOwnerUid();

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
      else if (data.startsWith('approve_') || data.startsWith('reject_')) {
        const action = data.split('_')[0];
        const docId = data.split('_')[1];
        
        if (action === 'reject') {
          await answerCallbackQuery(cb.id, "Acción rechazada");
          await editMessageText(chatId, messageId, "❌ Acción cancelada por el usuario.");
          return res.status(200).send('OK');
        }

        if (action === 'approve') {
          const docSnap = await getDoc(doc(dbNode, "telegram_proposals", docId));
          if (!docSnap.exists()) {
            await answerCallbackQuery(cb.id, "Propuesta no encontrada o ya ejecutada");
            await editMessageText(chatId, messageId, "⚠️ Propuesta expirada.");
            return res.status(200).send('OK');
          }

          const proposal = docSnap.data();
          const args = proposal.toolArgs;
          let resultMsg = "✅ Acción ejecutada.";

          try {
            if (proposal.toolName === 'add_task') {
              await saveTask(args.title);
              resultMsg = `✅ Tarea guardada: *${args.title}*`;
            } else if (proposal.toolName === 'add_transaction') {
              await saveTransaction({ amount: args.amount, description: args.description, type: args.type });
              const emoji = args.type === 'expense' ? '💸' : '💰';
              resultMsg = `${emoji} Transacción guardada: *$${args.amount}* (${args.description})`;
            } else if (proposal.toolName === 'add_diary_entry') {
              await saveJournal(args.text);
              resultMsg = `📖 Diario actualizado exitosamente.`;
            } else if (proposal.toolName === 'schedule_reminder') {
              const dbDate = args.date || new Date().toISOString().split('T')[0];
              const docRef = await saveTask(args.title, { reminderDate: dbDate, reminderTime: args.time, isRecurring: !!args.isRecurring });
              const endpoint = args.isRecurring ? '/api/reminders?action=schedule-recurring' : '/api/reminders?action=schedule-exact';
              const bodyPayload = args.isRecurring ? { id: docRef.id, title: args.title, time: args.time } : { id: docRef.id, title: args.title, date: dbDate, time: args.time };
              const schedRes = await fetch(`https://${reqHost}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bodyPayload) });
              if (schedRes.ok) {
                const schedData = await schedRes.json();
                if (schedData.success === false) {
                  resultMsg = `⚠️ Guardé la tarea, pero falló el aviso: ${schedData.error}`;
                } else {
                  if (schedData.messageId || schedData.scheduleId) await updateDoc(doc(dbNode, "lifestyle", docRef.id), { reminderId: schedData.messageId || schedData.scheduleId, isRecurring: !!args.isRecurring });
                  resultMsg = `⏰ Recordatorio programado para las ${args.time}`;
                }
              } else {
                resultMsg = `⚠️ Tarea guardada, falló alarma de servidor.`;
              }
            } else if (proposal.toolName === 'db_update') {
              await updateDoc(doc(dbNode, args.collection, args.id), { ...args.data, updatedAt: nowIso() });
              resultMsg = `✏️ Registro actualizado en ${args.collection}.`;
            } else if (proposal.toolName === 'db_delete') {
              await deleteDoc(doc(dbNode, args.collection, args.id));
              resultMsg = `🗑 Registro eliminado de ${args.collection}.`;
            }

            await deleteDoc(doc(dbNode, "telegram_proposals", docId));
            await answerCallbackQuery(cb.id, "Ejecutado");
            await editMessageText(chatId, messageId, resultMsg);
          } catch (e) {
            await answerCallbackQuery(cb.id, "Error");
            await editMessageText(chatId, messageId, `⚠️ Error ejecutando: ${e.message}`);
          }
        }
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
        // El texto que el usuario escribe junto a la foto es la NOTA opcional que ayuda a la IA.
        const caption = update.message.caption || '';

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
            body: JSON.stringify({ imageUrl: tgFileUrl, note: caption })
          });

          const ocrData = await ocrRes.json();
          if (ocrData.success) {
            const { amount, description, type } = ocrData.data;
            await saveTransaction({ amount, description: description || 'Gasto de comprobante', type: type || 'expense', receiptUrl: fileId });
            await sendTelegramMessage(chatId, `✅ *Comprobante procesado:*\nMonto: $${amount}\nConcepto: ${description}\nGuardado en Finanzas.`);
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
Escribe cualquier mensaje normal (sin la /) y lo guardo como tarea o lo interpreto con IA.

*⏰ Recordatorios:*
\`/recordar HH:MM [texto]\` - Ej: \`/recordar 15:30 Llamar al banco\`

*💸 Registrar Finanzas:*
\`/gasto [monto] [concepto]\` - Ej: \`/gasto 10 Cine\`
\`/ingreso [monto] [concepto]\` - Ej: \`/ingreso 500 Sueldo\`

*📖 Diario:*
\`/diario [texto]\`

*🔎 Consultas (no gastan IA):*
\`/saldo\` - Ingresos, gastos y balance del mes
\`/gastos\` - Tus últimos movimientos
\`/tareas\` - Tareas pendientes
\`/creditos\` - Saldo consumido de la API de IA`;
      }
      else if (text.startsWith('/saldo')) {
        try {
          const txs = (await readMine("transactions")).filter((t) => isThisMonth(t.createdAt));
          const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + usd(t), 0);
          const expense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + usd(t), 0);
          const bal = income - expense;
          responseText = `📊 *Balance del mes:*\n💰 Ingresos: $${income.toFixed(2)}\n💸 Gastos: $${expense.toFixed(2)}\n${bal >= 0 ? '✅' : '⚠️'} Balance: $${bal.toFixed(2)}`;
        } catch (e) {
          responseText = `⚠️ Error consultando saldo: ${e.message}`;
        }
      }
      else if (text.startsWith('/gastos')) {
        try {
          const txs = (await readMine("transactions"))
            .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
            .slice(0, 10);
          if (!txs.length) {
            responseText = "🧾 No tienes movimientos registrados aún.";
          } else {
            const lines = txs.map((t) => `${t.type === 'expense' ? '💸' : '💰'} $${usd(t).toFixed(2)} — ${t.description || 'Sin concepto'}`);
            responseText = `🧾 *Últimos movimientos:*\n${lines.join('\n')}`;
          }
        } catch (e) {
          responseText = `⚠️ Error consultando movimientos: ${e.message}`;
        }
      }
      else if (text.startsWith('/tareas')) {
        try {
          const pend = (await readMine("lifestyle"))
            .filter((i) => i.category === 'task' && !i.isCompleted)
            .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
          if (!pend.length) {
            responseText = "✅ ¡Inbox limpio! No tienes tareas pendientes.";
          } else {
            responseText = `📋 *Tareas pendientes (${pend.length}):*\n${pend.map((t) => `• ${t.title}`).join('\n')}`;
          }
        } catch (e) {
          responseText = `⚠️ Error consultando tareas: ${e.message}`;
        }
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
          await sendTelegramMessage(chatId, "⚠️ Formato inválido.\nEjemplos:\n`/recordar 15:30 Tarea`\n`/recordar 2026-07-20 15:30 Tarea`\n`/recordar diario 15:30 Tarea`");
          return res.status(200).send('OK');
        }

        timeStr = timeStr.padStart(5, '0');
        const title = parts.slice(titleStartIndex).join(' ') || 'Recordatorio Telegram';

        const docRef = await saveTask(title, {
          reminderDate: dateStr || new Date().toISOString().split('T')[0],
          reminderTime: timeStr,
          isRecurring: isDaily
        });

        const appUrl = `https://${req.headers.host}`;
        const endpoint = isDaily ? '/api/reminders?action=schedule-recurring' : '/api/reminders?action=schedule-exact';
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
            if (schedData.success === false) {
              responseText = schedData.noQstash
                ? `⚠️ Guardé "${title}" como tarea, pero el AVISO no se agendó: falta configurar *QSTASH_TOKEN* en el servidor.`
                : `⚠️ Guardé la tarea, pero falló el aviso: ${schedData.error || 'error del servidor'}.`;
            } else {
              const reminderId = isDaily ? schedData.scheduleId : schedData.messageId;
              if (reminderId) {
                await updateDoc(doc(dbNode, "lifestyle", docRef.id), { reminderId: reminderId, isRecurring: isDaily });
              }
              const dateStrMsg = isDaily ? 'todos los días' : (dateStr ? `el ${dateStr}` : 'hoy/mañana');
              responseText = `⏰ Recordatorio "${title}" programado para ${dateStrMsg} a las ${timeStr}.`;
            }
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
        
        await saveTransaction({ amount, description: title || 'Gasto Telegram', type: 'expense' });
        responseText = `💸 Gasto de $${amount} registrado.`;
      } 
      else if (text.startsWith('/ingreso ')) {
        const parts = text.replace('/ingreso ', '').split(' ');
        const amount = parseFloat(parts[0]);
        const title = parts.slice(1).join(' ');
        
        await saveTransaction({ amount, description: title || 'Ingreso Telegram', type: 'income' });
        responseText = `💰 Ingreso de $${amount} registrado.`;
      }
      else if (text.startsWith('/diario ')) {
        const content = text.replace('/diario ', '');
        await saveJournal(content);
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
          await editMessageText(chatId, tempMsgId, aiResponse.text, aiResponse.replyMarkup);
        } else {
          await sendTelegramMessage(chatId, aiResponse.text, aiResponse.replyMarkup);
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
