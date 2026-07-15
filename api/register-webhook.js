export default async function handler(req, res) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return res.status(500).json({ error: "Falta TELEGRAM_BOT_TOKEN" });

  const appUrl = `https://${req.headers.host}`; 
  const webhookUrl = `${appUrl}/api/telegram-webhook`;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET || "diary_secret_2026";

  const url = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}&secret_token=${secret}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return res.status(200).json({ success: true, telegramResponse: data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
