export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { imageUrl } = req.body;
  if (!imageUrl) return res.status(400).json({ error: "Falta imageUrl" });

  // Cambiado a OpenRouter
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Falta OPENROUTER_API_KEY" });

  try {
    let base64Data = "";
    let mimeType = "image/jpeg";

    if (imageUrl.startsWith("http")) {
      // Viene desde Telegram (URL)
      const imageRes = await fetch(imageUrl);
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

    const promptText = `Analiza este comprobante de pago/transferencia o factura.
Extrae la siguiente información y devuélvela estrictamente en un objeto JSON con este formato exacto:
{
  "amount": número (el monto total transferido o pagado, usa punto decimal, sin separador de miles. Ej: 15.50),
  "date": "YYYY-MM-DD" (fecha de la transacción, si no está usa la fecha de hoy),
  "description": "texto descriptivo breve del comercio, banco o persona receptora",
  "type": "expense" (o "income" si es claramente un dinero recibido o saldo a favor)
}
No devuelvas NADA más que el JSON puro.`;

    const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
    
    const response = await fetch(openRouterUrl, {
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
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Data}`
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));

    const resultText = data.choices[0].message.content.trim();
    // Limpieza por si acaso
    const jsonStr = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    return res.status(200).json({ success: true, data: parsed });

  } catch (error) {
    console.error("OCR Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
