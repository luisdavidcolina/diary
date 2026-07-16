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
      }
    ];

    const systemPrompt = `Eres un asistente inteligente integrado en la aplicación web personal (Diario y Finanzas) del usuario.
Tu objetivo es ayudar al usuario a gestionar su vida. Tienes acceso a herramientas (functions) para leer y modificar su base de datos.
La fecha y hora actual del servidor es: ${new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" })}.
REGLAS IMPORTANTES:
- Si el usuario te pide registrar un gasto, usa la herramienta add_transaction y confírmale.
- Si el usuario te pregunta por sus finanzas o saldo, usa get_finance_summary y luego explícale los datos.
- Si el usuario te cuenta algo íntimo o del día a día y quiere que lo guardes, usa add_diary_entry.
- Si el usuario pregunta por el contexto general de la app, sus materias, temarios o enlaces, usa get_docs_list para ver qué archivos existen y luego read_doc_file para leer el contenido que necesites antes de responder.
- Responde siempre de manera concisa, amigable y usando emojis.`;

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

      formattedMessages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
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
    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));

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
