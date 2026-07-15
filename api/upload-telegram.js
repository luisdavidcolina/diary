export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ error: "Falta imageBase64" });

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return res.status(500).json({ error: "Falta config de Telegram" });

  try {
    // Convert base64 to Buffer
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Create Blob for FormData
    const blob = new Blob([buffer], { type: 'image/jpeg' });
    
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('photo', blob, 'receipt.jpg');
    formData.append('caption', '📷 Comprobante subido desde la Web (OCR)');

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: 'POST',
      body: formData
    });

    const tgData = await tgRes.json();
    if (!tgData.ok) {
      throw new Error("Error enviando a Telegram: " + tgData.description);
    }

    const photoArray = tgData.result.photo;
    const fileId = photoArray[photoArray.length - 1].file_id;

    return res.status(200).json({ success: true, fileId });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
