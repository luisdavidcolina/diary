export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const { title } = req.body;

  if (!token || !chatId) {
    return res.status(500).json({ error: "Faltan credenciales de Telegram" });
  }

  const message = `⏱️ *Recordatorio Programado*\n\n¡Es la hora! Tienes que: *${title}*`;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      }),
    });

    const data = await response.json();
    
    if (data.ok) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(500).json({ success: false, error: data.description });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
