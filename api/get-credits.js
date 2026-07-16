export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Falta OPENROUTER_API_KEY" });

  try {
    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const usage = data.data.usage || 0;
    return res.status(200).json({ usage: usage.toFixed(4) });
  } catch (error) {
    console.error("Credits Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
