// Endpoint doble (para no exceder el límite de 12 funciones del plan Hobby):
//  - GET /api/get-credits            → saldo/consumo de OpenRouter
//  - GET /api/get-credits?type=rates → tasas BCV + Binance P2P (vía rewrite /api/rates)
//  - GET /api/get-credits?type=daily → consumo diario de la API
import { checkDailyLimit } from "./_costTracker.js";

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

// ─────────── Catálogo completo de modelos de OpenRouter ───────────
// Se cachea en el edge de Vercel 6 h (el catálogo cambia poco y son ~300+ modelos).
// Normaliza lo que necesita el selector: precios, contexto, herramientas, caché,
// visión y proveedor. El coste real por 1000 mensajes se calcula en el cliente.
async function handleModels(res) {
  try {
    const r = await fetch('https://openrouter.ai/api/v1/models');
    if (!r.ok) throw new Error(`OpenRouter models ${r.status}`);
    const j = await r.json();

    const models = (j.data || []).map((m) => {
      const p = m.pricing || {};
      const num = (v) => {
        const n = parseFloat(v);
        return Number.isFinite(n) ? n : 0;
      };
      // OpenRouter da precios por token → los pasamos a precio por millón.
      const promptM = num(p.prompt) * 1e6;
      const completionM = num(p.completion) * 1e6;
      const cacheReadM = num(p.input_cache_read) * 1e6;
      const params = m.supported_parameters || [];
      const modalities = m.architecture?.input_modalities || [];

      return {
        id: m.id,
        name: m.name || m.id,
        provider: (m.id.split('/')[0] || 'otros'),
        description: m.description || '',
        contextLength: m.context_length || m.top_provider?.context_length || 0,
        pricePromptPerM: promptM,
        priceCompletionPerM: completionM,
        priceCacheReadPerM: cacheReadM,
        // Capacidades que el selector filtra:
        supportsTools: params.includes('tools') || params.includes('tool_choice'),
        supportsCache: num(p.input_cache_read) > 0 || num(p.input_cache_write) > 0,
        supportsImages: modalities.includes('image'),
        isFree: promptM === 0 && completionM === 0
      };
    });

    res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
    return res.status(200).json({ models, count: models.length, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Models Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  // Ruta de tasas (reescrita desde /api/rates).
  if (req.query?.type === 'rates') return handleRates(res);

  // Catálogo de modelos para el selector del Asistente.
  if (req.query?.type === 'models') return handleModels(res);

  // Ruta de costo diario.
  if (req.query?.type === 'daily') {
    try {
      const limitInfo = await checkDailyLimit();
      return res.status(200).json(limitInfo);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

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
