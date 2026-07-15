export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).send("Falta id");

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return res.status(500).send("Falta TELEGRAM_BOT_TOKEN");

  try {
    // 1. Get file path
    const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${id}`);
    const fileData = await fileRes.json();
    if (!fileData.ok) {
      return res.status(404).send("Image not found in Telegram");
    }

    // 2. Fetch image content
    const filePath = fileData.result.file_path;
    const imgUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
    
    const imageRes = await fetch(imgUrl);
    
    // 3. Proxy to client
    const buffer = await imageRes.arrayBuffer();
    
    // Cache header (cache forever since file_id is immutable)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Type', imageRes.headers.get('content-type') || 'image/jpeg');
    
    return res.status(200).send(Buffer.from(buffer));
  } catch (err) {
    console.error("Image proxy error:", err);
    return res.status(500).send("Error fetching image");
  }
}
