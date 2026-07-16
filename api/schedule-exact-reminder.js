export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { id, title, date, time } = req.body;
  const qstashToken = process.env.QSTASH_TOKEN;
  const appUrl = `https://${req.headers.host}`; 

  if (!qstashToken) {
    console.error("QSTASH_TOKEN no configurado. El recordatorio exacto no se enviará.");
    // Antes devolvía success:true y el bot decía "programado" sin agendar nada.
    // Ahora lo señalamos para poder avisar al usuario.
    return res.status(200).json({ success: false, noQstash: true, error: "Falta QSTASH_TOKEN en el servidor." });
  }

  // Parseamos la fecha y hora objetivo (ej. 2026-07-20T15:30:00) en zona horaria de Venezuela (UTC-4)
  const targetDate = new Date(`${date}T${time}:00-04:00`);
  // QStash usa notBefore en segundos (UNIX timestamp)
  const notBefore = Math.floor(targetDate.getTime() / 1000);

  const baseUrl = process.env.QSTASH_URL || 'https://qstash.upstash.io';
  const qstashUrl = `${baseUrl}/v2/publish/${appUrl}/api/send-exact-reminder`;

  try {
    const response = await fetch(qstashUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${qstashToken}`,
        'Content-Type': 'application/json',
        'Upstash-Not-Before': notBefore.toString()
      },
      body: JSON.stringify({ id, title })
    });

    const data = await response.json();
    if (response.ok) {
        return res.status(200).json({ success: true, messageId: data.messageId });
    } else {
        return res.status(500).json({ success: false, error: data });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
