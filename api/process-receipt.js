import { checkDailyLimit, logApiCost } from "./_costTracker.js";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const limitStatus = await checkDailyLimit();
  if (!limitStatus.allowed) {
    return res.status(200).json({ success: false, error: limitStatus.message });
  }

  // `note` es OPCIONAL: si viene, ayuda a la IA a interpretar mejor el comprobante.
  const { imageUrl, note } = req.body;
  if (!imageUrl) return res.status(400).json({ success: false, error: "Falta imageUrl" });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(500).json({ success: false, error: "Falta OPENROUTER_API_KEY" });

  try {
    let base64Data = "";
    let mimeType = "image/jpeg";

    if (imageUrl.startsWith("http")) {
      // Viene desde Telegram (URL)
      const imageRes = await fetch(imageUrl);
      if (!imageRes.ok) throw new Error("No se pudo descargar la imagen del comprobante");
      const buffer = await imageRes.arrayBuffer();
      base64Data = Buffer.from(buffer).toString('base64');
      mimeType = imageRes.headers.get('content-type') || "image/jpeg";
    } else if (imageUrl.startsWith("data:image")) {
      // Viene desde la Web (Base64)
      const matches = imageUrl.match(/^data:(image\/\w+);base64,(.*)$/);
      if (!matches) throw new Error("Formato Base64 inválido");
      mimeType = matches[1];
      base64Data = matches[2];
    } else {
      throw new Error("Formato de imagen no soportado");
    }

    // La nota del usuario se antepone como contexto para guiar la extracción.
    const noteBlock = note && note.trim()
      ? `\nContexto que da el usuario (úsalo para desambiguar el monto, el tipo o el concepto): "${note.trim()}"\n`
      : '';

    const promptText = `Analiza este comprobante de pago/transferencia, factura o estado de cuenta bancario/pantallazo de saldo.${noteBlock}
Extrae la siguiente información y devuélvela estrictamente en un objeto JSON con este formato exacto:
{
  "isBalanceUpdate": true/false (true si la imagen muestra el saldo actual/disponible de una cuenta o wallet en lugar de un comprobante de un pago/gasto/ingreso puntual),
  "accountName": "nombre aproximado del banco o wallet, ej: Mercantil, BDV, BCP, Bancamiga, Binance" (solo si isBalanceUpdate es true),
  "balance": número (el saldo total o disponible de la cuenta que se muestra, usa punto decimal, sin separador de miles. Ej: 324.29) (solo si isBalanceUpdate es true),
  "amount": número (el monto total transferido o pagado, si es un comprobante de un pago/gasto/ingreso puntual. Ej: 15.50) (si isBalanceUpdate es false),
  "date": "YYYY-MM-DD" (fecha de la transacción o de hoy),
  "description": "texto descriptivo breve del comercio, banco o persona receptora",
  "type": "expense" (o "income" si es claramente un dinero recibido, saldo a favor o ingreso)
}
No devuelvas NADA más que el JSON puro.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: promptText },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } }
            ]
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`OpenRouter respondió ${response.status}: ${errText.slice(0, 200)}`);
    }

    const data = await response.json();
    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));

    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("La IA no devolvió contenido");

    const jsonStr = content.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    const usage = data.usage;
    let cost = usage?.cost || 0;
    if (!cost && usage) {
      cost = (usage.prompt_tokens * 0.00000015) + (usage.completion_tokens * 0.00000060);
    }
    await logApiCost(cost, 'receipt-ocr', usage, "OCR: " + promptText.slice(0, 50));

    return res.status(200).json({ success: true, data: parsed });

  } catch (error) {
    console.error("OCR Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
