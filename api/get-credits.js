// Endpoint doble (para no exceder el límite de 12 funciones del plan Hobby):
//  - GET /api/get-credits            → saldo/consumo de OpenRouter
//  - GET /api/get-credits?type=rates → tasas BCV + Binance P2P (vía rewrite /api/rates)

// BCV oficial vía dolarapi (JSON estable y mantenido).
async function fetchBCV() {
  try {
    const r = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
    if (!r.ok) return 0;
    const j = await r.json();
    return Number(j.promedio || j.venta || 0);
  } catch {
    return 0;
  }
}

// Promedio P2P USDT→VES: media de los primeros N anuncios de venta en Binance P2P.
async function fetchBinanceP2P(rows = 10) {
  try {
    const r = await fetch('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify({ asset: 'USDT', fiat: 'VES', tradeType: 'SELL', page: 1, rows, payTypes: [] })
    });
    if (!r.ok) return 0;
    const j = await r.json();
    const prices = (j.data || [])
      .map((x) => parseFloat(x?.adv?.price))
      .filter((p) => Number.isFinite(p) && p > 0);
    if (!prices.length) return 0;
    return prices.reduce((a, b) => a + b, 0) / prices.length;
  } catch {
    return 0;
  }
}

async function handleRates(res) {
  try {
    const [bcv, binance] = await Promise.all([fetchBCV(), fetchBinanceP2P()]);
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    return res.status(200).json({
      bcv: Number(bcv.toFixed(2)),
      binance: Number(binance.toFixed(2)),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Rates Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  // Ruta de tasas (reescrita desde /api/rates).
  if (req.query?.type === 'rates') return handleRates(res);

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
