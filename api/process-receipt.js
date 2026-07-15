export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { imageUrl } = req.body;
  if (!imageUrl) return res.status(400).json({ error: "Falta imageUrl" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Falta OPENAI_API_KEY" });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analiza este comprobante de pago/transferencia o factura.
Extrae la siguiente información y devuélvela estrictamente en un objeto JSON con este formato exacto:
{
  "amount": número (el monto total transferido o pagado, usa punto decimal, sin separador de miles. Ej: 15.50),
  "date": "YYYY-MM-DD" (fecha de la transacción, si no está usa la fecha de hoy),
  "description": "texto descriptivo breve del comercio, banco o persona receptora",
  "type": "expense" (o "income" si es claramente un dinero recibido o saldo a favor)
}
No devuelvas NADA más que el JSON puro, sin marcadores de markdown.`
              },
              {
                type: "image_url",
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        max_tokens: 200,
        temperature: 0.1
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const resultText = data.choices[0].message.content.trim();
    // Limpiar si OpenAI manda bloque de código
    const jsonStr = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    return res.status(200).json({ success: true, data: parsed });

  } catch (error) {
    console.error("OCR Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
