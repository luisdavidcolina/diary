import { buildSystemPrompt } from './_context.js';
import { loadBotBrain } from './_botConfig.js';
import { checkDailyLimit, logApiCost } from './_costTracker.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Falta array de messages" });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Falta OPENROUTER_API_KEY en Vercel" });

  try {
    const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
    
    // Tools schema for OpenAI/OpenRouter
    const tools = [
      {
        type: "function",
        function: {
          name: "get_finance_summary",
          description: "Obtiene el balance actual y el total gastado en cada categoría de finanzas para el usuario actual.",
          parameters: { type: "object", properties: {} }
        }
      },
      {
        type: "function",
        function: {
          name: "add_transaction",
          description: "Registra un nuevo gasto o ingreso en la base de datos de finanzas.",
          parameters: {
            type: "object",
            properties: {
              amount: { type: "number", description: "El monto de la transacción (ej. 15.5)" },
              description: { type: "string", description: "Descripción de la transacción (ej. 'Taxi')" },
              type: { type: "string", description: "El tipo: debe ser 'expense' (gasto) o 'income' (ingreso)" },
              category: { type: "string", description: "Para gastos, debe ser una de: 'house', 'food', 'transport', 'fun', 'remittances', 'other'" }
            },
            required: ["amount", "description", "type"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "add_diary_entry",
          description: "Añade una nueva entrada al diario personal del usuario.",
          parameters: {
            type: "object",
            properties: {
              text: { type: "string", description: "El contenido de la entrada del diario" }
            },
            required: ["text"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_diary_entries",
          description: "Obtiene las entradas más recientes del diario del usuario.",
          parameters: { type: "object", properties: {} }
        }
      },
      {
        type: "function",
        function: {
          name: "get_docs_list",
          description: "Explora la estructura de la aplicación y obtiene la lista de todos los documentos y materiales de estudio (archivos .md) disponibles en la carpeta docs/.",
          parameters: { type: "object", properties: {} }
        }
      },
      {
        type: "function",
        function: {
          name: "read_doc_file",
          description: "Lee el contenido exacto de un archivo de documento o materia.",
          parameters: {
            type: "object",
            properties: {
              filepath: { type: "string", description: "Ruta del archivo (ej. 'PLAN_ESTUDIO.md' o 'ingles/guia.md')" }
            },
            required: ["filepath"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_api_credits",
          description: "Consulta el saldo o los créditos gastados en la API de Inteligencia Artificial (OpenRouter).",
          parameters: { type: "object", properties: {} }
        }
      },
      {
        type: "function",
        function: {
          name: "schedule_reminder",
          description: "Programa un recordatorio o alarma para una fecha y hora específica, o un recordatorio recurrente diario.",
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
          description: "Lee/consulta registros de CUALQUIER colección de la base de datos del usuario. Úsala para revisar, buscar o listar datos (y para obtener el 'id' de un registro antes de modificarlo o borrarlo).",
          parameters: {
            type: "object",
            properties: {
              collection: { type: "string", description: "Nombre de la colección: 'transactions', 'journal_entries', 'lifestyle', 'accounts' o 'library_items'" },
              limit: { type: "number", description: "Cuántos registros recientes traer (por defecto 10)" }
            },
            required: ["collection"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "db_update",
          description: "Modifica/corrige un registro existente en cualquier colección. Primero usa db_query para obtener su 'id'. Envía en 'data' solo los campos a cambiar.",
          parameters: {
            type: "object",
            properties: {
              collection: { type: "string", description: "'transactions', 'journal_entries', 'lifestyle', 'accounts' o 'library_items'" },
              id: { type: "string", description: "El id del registro a modificar" },
              data: { type: "object", description: "Campos a actualizar, ej. { amount: 20, description: 'Corregido' }" }
            },
            required: ["collection", "id", "data"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "db_delete",
          description: "Elimina un registro de cualquier colección. Primero usa db_query para obtener su 'id'. Pide confirmación al usuario si no está claro.",
          parameters: {
            type: "object",
            properties: {
              collection: { type: "string", description: "'transactions', 'journal_entries', 'lifestyle', 'accounts' o 'library_items'" },
              id: { type: "string", description: "El id del registro a eliminar" }
            },
            required: ["collection", "id"]
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
      },
      {
        type: "function",
        function: {
          name: "navigate_to",
          description: "Redirige al usuario a una página específica de la aplicación web. Úsala cuando el usuario pida ir o ver una sección (ej. 'llévame a finanzas', 'quiero ver mi diario', 'vamos a la biblioteca').",
          parameters: {
            type: "object",
            properties: {
              path: { type: "string", description: "La ruta de la aplicación a la cual redirigir: '/', '/calendar', '/finance', '/lifestyle', '/journal', '/library', o '/asistente'." }
            },
            required: ["path"]
          }
        }
      }
    ];

    // Cerebro editable desde la web (identidad, personalidad, reglas, conocimiento).
    const brain = await loadBotBrain();
    const systemPrompt = `${buildSystemPrompt({
      config: brain.config,
      knowledge: brain.knowledge,
      surface: 'Estás respondiendo dentro de la app web. Tienes acceso COMPLETO (leer, crear, modificar y borrar) a la base de datos.',
      now: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })
    })}

COLECCIONES de la base de datos y sus campos:
- transactions (finanzas): amount, amountUSD, currency ('USD'|'VES'), description, type ('expense'|'income'), category.
- journal_entries (diario): content, mood.
- lifestyle (tareas y hábitos): title, category ('task'|'habit'), isCompleted (boolean).
- accounts (cuentas/wallets): name, currency, balance, accountNumber.
- library_items (biblioteca): title, url, type, status ('unread'|'read').
- syllabus (TEMARIO de estudio): subjectTitle (materia), unit (tema/unidad), title (subtema), details (puntos). Consúltala para responder "qué temas estudio", "temas de cálculo", etc.

REGLAS:
- Registrar gasto/ingreso → add_transaction. Recordatorio/alarma con hora → schedule_reminder. Nota del diario → add_diary_entry.
- Para LEER, buscar o listar cualquier dato → db_query (devuelve también el 'id' de cada registro).
- Para MODIFICAR o CORREGIR un registro → primero db_query para hallar su 'id', luego db_update.
- Para BORRAR → db_query para el 'id', luego db_delete (confirma con el usuario si hay ambigüedad).
- Marcar una tarea como completada = db_update en 'lifestyle' con { isCompleted: true }.
- Resumen de finanzas → get_finance_summary. Materias/temarios → get_docs_list + read_doc_file. Créditos → check_api_credits.
- Responde conciso, amigable y con emojis.`;

    // 1. Verificar límite diario
    const limitStatus = await checkDailyLimit();
    if (!limitStatus.allowed) {
      return res.status(200).json({ type: 'text', text: `⚠️ ${limitStatus.message}` });
    }

    const formattedMessages = [
      { role: 'system', content: systemPrompt }
    ];

    // Mapear historial al formato de OpenAI
    for (const msg of messages) {
      if (msg.role === 'function') {
        formattedMessages.push({
          role: 'tool',
          tool_call_id: "call_" + msg.name, // Fake ID since our frontend doesn't track tool_call_ids
          name: msg.name,
          content: msg.content
        });
        continue;
      }
      
      if (msg.functionCall) {
        formattedMessages.push({
          role: 'assistant',
          content: null,
          tool_calls: [{
            id: "call_" + msg.functionCall.name,
            type: "function",
            function: {
              name: msg.functionCall.name,
              arguments: JSON.stringify(msg.functionCall.arguments)
            }
          }]
        });
        continue;
      }

      if (msg.role === 'user') {
        if (msg.images && msg.images.length > 0) {
          const contentArray = [{ type: 'text', text: msg.content || '' }];
          for (const img of msg.images) {
            contentArray.push({ type: 'image_url', image_url: { url: img } });
          }
          formattedMessages.push({
            role: 'user',
            content: contentArray
          });
        } else {
          formattedMessages.push({
            role: 'user',
            content: msg.content
          });
        }
      } else {
        formattedMessages.push({
          role: 'assistant',
          content: msg.content
        });
      }
    }

    const response = await fetch(openRouterUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: formattedMessages,
        tools: tools,
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message || "Error en OpenRouter");

    // 2. Registrar costo
    if (data.usage && data.usage.cost) {
      const promptPreview = messages.length > 0 ? messages[messages.length - 1].content : '';
      await logApiCost(data.usage.cost, 'web', data.usage, promptPreview);
    }

    const responseMessage = data.choices[0].message;

    // Verificar si es una llamada a función
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCall = responseMessage.tool_calls[0].function;
      return res.status(200).json({
        type: 'function_call',
        functionCall: {
          name: toolCall.name,
          arguments: JSON.parse(toolCall.arguments)
        }
      });
    }

    // Es un mensaje de texto normal
    return res.status(200).json({
      type: 'text',
      text: responseMessage.content
    });

  } catch (error) {
    console.error("Chat Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
