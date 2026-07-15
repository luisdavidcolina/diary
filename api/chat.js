export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Falta array de messages" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Falta GEMINI_API_KEY en Vercel" });

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    // Tools schema for Gemini
    const tools = [{
      functionDeclarations: [
        {
          name: "get_finance_summary",
          description: "Obtiene el balance actual y el total gastado en cada categoría de finanzas para el usuario actual."
        },
        {
          name: "add_transaction",
          description: "Registra un nuevo gasto o ingreso en la base de datos de finanzas.",
          parameters: {
            type: "OBJECT",
            properties: {
              amount: { type: "NUMBER", description: "El monto de la transacción (ej. 15.5)" },
              description: { type: "STRING", description: "Descripción de la transacción (ej. 'Taxi')" },
              type: { type: "STRING", description: "El tipo: debe ser 'expense' (gasto) o 'income' (ingreso)" },
              category: { type: "STRING", description: "Para gastos, debe ser una de: 'house', 'food', 'transport', 'fun', 'remittances', 'other'" }
            },
            required: ["amount", "description", "type"]
          }
        },
        {
          name: "add_diary_entry",
          description: "Añade una nueva entrada al diario personal del usuario.",
          parameters: {
            type: "OBJECT",
            properties: {
              text: { type: "STRING", description: "El contenido de la entrada del diario" }
            },
            required: ["text"]
          }
        },
        {
          name: "get_diary_entries",
          description: "Obtiene las entradas más recientes del diario del usuario."
        }
      ]
    }];

    const systemInstruction = {
      parts: [{
        text: `Eres un asistente inteligente integrado en la aplicación web personal (Diario y Finanzas) del usuario.
Tu objetivo es ayudar al usuario a gestionar su vida. Tienes acceso a herramientas (functions) para leer y modificar su base de datos.
REGLAS IMPORTANTES:
- Si el usuario te pide registrar un gasto, usa la herramienta add_transaction y confírmale.
- Si el usuario te pregunta por sus finanzas o saldo, usa get_finance_summary y luego explícale los datos.
- Si el usuario te cuenta algo íntimo o del día a día y quiere que lo guardes, usa add_diary_entry.
- Responde siempre de manera concisa, amigable y usando emojis.`
      }]
    };

    // Format messages for Gemini API
    const contents = messages.map(msg => {
      // Si el mensaje es una llamada a función o un resultado de función,
      // la estructura en Gemini es diferente.
      
      if (msg.role === 'function') {
        // Respuesta del cliente después de ejecutar la herramienta
        return {
          role: 'function', // In Gemini it's 'function' (Wait, in Gemini REST API the role is 'user' or 'model'. Actually, function response is role: 'function' or role: 'user' with parts: [{ functionResponse: { name, response: { ... } } }])
          parts: [{
            functionResponse: {
              name: msg.name,
              response: { result: msg.content }
            }
          }]
        };
      }
      
      if (msg.functionCall) {
        // Historial de cuándo el modelo llamó a la herramienta
        return {
          role: 'model',
          parts: [{
            functionCall: {
              name: msg.functionCall.name,
              args: msg.functionCall.arguments
            }
          }]
        };
      }

      // Mensajes de texto normales
      return {
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      };
    });

    const bodyPayload = {
      systemInstruction,
      contents,
      tools,
      generationConfig: {
        temperature: 0.7
      }
    };

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyPayload)
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const firstCandidate = data.candidates[0];
    const firstPart = firstCandidate.content.parts[0];

    // Verificar si es una llamada a función
    if (firstPart.functionCall) {
      return res.status(200).json({
        type: 'function_call',
        functionCall: {
          name: firstPart.functionCall.name,
          arguments: firstPart.functionCall.args
        }
      });
    }

    // Es un mensaje de texto normal
    return res.status(200).json({
      type: 'text',
      text: firstPart.text
    });

  } catch (error) {
    console.error("Chat Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
