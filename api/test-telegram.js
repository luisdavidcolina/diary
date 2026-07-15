export default async function handler(req, res) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return res.status(500).json({ error: "Faltan credenciales de Telegram" });
  }

  // Permite GET y POST
  const message = "¡Hola Luisdavid! 🚀 Este es un mensaje de prueba desde el servidor de tu Diario. Si puedes leer esto, ¡la Fase 2 de conexión fue un éxito total!";

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
      }),
    });

    const data = await response.json();
    
    if (data.ok) {
      return res.status(200).json({ success: true, message: "Mensaje enviado exitosamente" });
    } else {
      return res.status(500).json({ success: false, error: data.description });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
