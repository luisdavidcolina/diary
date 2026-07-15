export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { reminderId, isRecurring } = req.body;
  const qstashToken = process.env.QSTASH_TOKEN;

  if (!qstashToken) {
    return res.status(200).json({ success: true, message: "Ignorado (sin QStash)" });
  }

  const baseUrl = process.env.QSTASH_URL || 'https://qstash.upstash.io';
  
  const endpoint = isRecurring 
    ? `${baseUrl}/v2/schedules/${reminderId}` 
    : `${baseUrl}/v2/messages/${reminderId}`;

  try {
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${qstashToken}`
      }
    });

    // A veces DELETE devuelve 202 sin cuerpo o 200. response.ok captura todo 2xx
    if (response.ok) {
        return res.status(200).json({ success: true });
    } else {
        const data = await response.json();
        return res.status(500).json({ success: false, error: data });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
