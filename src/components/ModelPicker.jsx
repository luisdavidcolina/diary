import React, { useEffect, useMemo, useState } from 'react';

// Coste REAL, no precio de lista: cada mensaje reenvía el system prompt + tools,
// así que un modelo sin caché paga esa entrada íntegra SIEMPRE y puede salir más
// caro que otro con salida "más cara" pero con caché.
// Los tokens salen de TU consumo real (api_usage); estos son solo el respaldo
// si aún no hay historial.
const FALLBACK_IN = 1770;
const FALLBACK_OUT = 150;

const costPer1000 = (m, inTok = FALLBACK_IN, outTok = FALLBACK_OUT) => {
  const inPrice = m.supportsCache && m.priceCacheReadPerM > 0 ? m.priceCacheReadPerM : m.pricePromptPerM;
  const perMsg = (inTok / 1e6) * inPrice + (outTok / 1e6) * m.priceCompletionPerM;
  return perMsg * 1000;
};

const money = (n) => (n === 0 ? '$0' : n < 0.01 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`);
const perM = (n) => (n === 0 ? 'gratis' : `$${n < 1 ? n.toFixed(3) : n.toFixed(2)}/M`);
const ctx = (n) => (n >= 1000 ? `${Math.round(n / 1000)}K` : String(n || 0));

const SORTS = [
  { id: 'cost', label: '💸 Costo real (barato → caro)' },
  { id: 'context', label: '📏 Contexto (mayor primero)' },
  { id: 'name', label: '🔤 Nombre (A-Z)' }
];

const DEFAULT_FILTERS = { tools: true, cache: false, free: false, images: false, maxCost: '', minContext: '' };

// `usageStats` (opcional) viene de tu historial real de api_usage:
//   { calls, avgIn, avgOut, per1000, byModel: { [id]: {calls, avgIn, avgOut, per1000} } }
//
// El ranking usa SIEMPRE el mismo baseline de tokens (tu carga típica). Medir
// cada modelo con sus propios tokens los volvería incomparables: variarían a la
// vez precio y carga, y un modelo saldría "barato" solo por haberlo usado en
// consultas más cortas. `real()` sí es el costo medido, y solo existe para los
// modelos que ya corriste.
const ModelPicker = ({ value, onChange, usageStats = null }) => {
  const inTok = usageStats?.avgIn || FALLBACK_IN;
  const outTok = usageStats?.avgOut || FALLBACK_OUT;
  const cost1k = (m) => costPer1000(m, inTok, outTok);
  const real = (m) => usageStats?.byModel?.[m.id] || null;
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [provider, setProvider] = useState('all');
  const [sort, setSort] = useState('cost');
  const [groupByProvider, setGroupByProvider] = useState(false);
  const [f, setF] = useState(DEFAULT_FILTERS);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/get-credits?type=models');
        const j = await r.json();
        if (j.error) throw new Error(j.error);
        setModels(j.models || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const current = models.find((m) => m.id === value);
  const currentCost = current ? cost1k(current) : null;

  // Proveedores con su conteo.
  const providers = useMemo(() => {
    const map = {};
    models.forEach((m) => { map[m.provider] = (map[m.provider] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [models]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = models.filter((m) => {
      if (q && !(`${m.name} ${m.id} ${m.provider}`.toLowerCase().includes(q))) return false;
      if (provider !== 'all' && m.provider !== provider) return false;
      if (f.cache && !m.supportsCache) return false;
      if (f.free && !m.isFree) return false;
      if (f.images && !m.supportsImages) return false;
      if (f.maxCost !== '' && cost1k(m) > parseFloat(f.maxCost)) return false;
      if (f.minContext !== '' && m.contextLength < parseFloat(f.minContext) * 1000) return false;
      // "Con herramientas" no oculta: atenúa (se ven al final).
      return true;
    });

    list.sort((a, b) => {
      if (f.tools && a.supportsTools !== b.supportsTools) return a.supportsTools ? -1 : 1;
      if (sort === 'cost') return cost1k(a) - cost1k(b);
      if (sort === 'context') return (b.contextLength || 0) - (a.contextLength || 0);
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [models, search, provider, sort, f]);

  const grouped = useMemo(() => {
    if (!groupByProvider) return null;
    const g = {};
    filtered.forEach((m) => { (g[m.provider] = g[m.provider] || []).push(m); });
    return Object.entries(g);
  }, [filtered, groupByProvider]);

  const pick = (m) => {
    if (!m.supportsTools) {
      const ok = window.confirm(
        `⚠️ "${m.name}" NO soporta herramientas.\n\nSin ellas el asistente no podrá consultar tu temario, finanzas ni crear recordatorios: quedaría solo para conversar.\n\n¿Usarlo igual?`
      );
      if (!ok) return;
    }
    onChange(m.id);
  };

  if (loading) return <p className="muted">Cargando catálogo de modelos…</p>;
  if (error) return <p style={{ color: '#b91c1c', fontWeight: 700 }}>⚠️ No se pudo cargar el catálogo: {error}</p>;

  const Card = (m) => {
    const c = cost1k(m);
    const r = real(m);
    const isCurrent = m.id === value;
    const mult = currentCost && currentCost > 0 && !isCurrent ? c / currentCost : null;
    return (
      <div key={m.id} className="mp-card" style={{
        opacity: m.supportsTools ? 1 : 0.5,
        background: isCurrent ? 'var(--brutal-green)' : 'var(--brutal-white)'
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <strong style={{ fontSize: '1rem' }}>{m.name}</strong>
            <span className="mp-tag" style={{ background: '#ddd' }}>{m.provider}</span>
            {m.isFree && <span className="mp-tag" style={{ background: 'var(--brutal-green)' }}>gratis</span>}
            {m.supportsCache && <span className="mp-tag" style={{ background: 'var(--brutal-blue)' }}>caché</span>}
            {m.supportsImages && <span className="mp-tag" style={{ background: 'var(--brutal-yellow)' }}>image</span>}
            {!m.supportsTools && <span className="mp-tag" style={{ background: 'var(--brutal-orange)' }}>sin herramientas</span>}
          </div>
          <code style={{ fontSize: '0.7rem', opacity: 0.7, display: 'block', margin: '0.2rem 0', wordBreak: 'break-all' }}>{m.id}</code>
          <p style={{ fontSize: '0.75rem', margin: 0, opacity: 0.75, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {m.description}
          </p>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '132px' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1.1 }}>{money(c)}</div>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase' }}>
            {r ? 'estimado' : ''} cada 1000 msj
          </div>
          {r && (
            <div style={{ fontSize: '0.66rem', fontWeight: 800, background: 'var(--brutal-blue)', border: '2px solid #000', padding: '0.1rem 0.25rem', marginTop: '0.2rem' }}>
              real {money(r.per1000)} · {r.calls} uso{r.calls === 1 ? '' : 's'}
            </div>
          )}
          {mult && (
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: mult > 1 ? '#b91c1c' : '#15803d' }}>
              {mult > 1 ? `${mult.toFixed(1)}× más caro` : `${(1 / mult).toFixed(1)}× más barato`}
            </div>
          )}
          <div style={{ fontSize: '0.62rem', marginTop: '0.3rem', opacity: 0.75 }}>
            in {perM(m.pricePromptPerM)} · out {perM(m.priceCompletionPerM)}<br />ctx {ctx(m.contextLength)}
          </div>
          <button
            className="link-btn"
            style={{ marginTop: '0.4rem', background: isCurrent ? '#fff' : 'var(--brutal-yellow)' }}
            onClick={() => pick(m)}
            disabled={isCurrent}
          >
            {isCurrent ? '✓ En uso' : 'Usar'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Modelo actual */}
      <div style={{ background: 'var(--brutal-green)', border: '3px solid #000', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>Modelo en uso</div>
          <strong>{current ? current.name : value}</strong>
        </div>
        {current && (
          <div style={{ display: 'flex', gap: '1rem', textAlign: 'right' }}>
            <div>
              <strong>{money(currentCost)}</strong>
              <div style={{ fontSize: '0.62rem', fontWeight: 700 }}>estimado /1000 msj</div>
            </div>
            {real(current) && (
              <div style={{ borderLeft: '2px solid #000', paddingLeft: '1rem' }}>
                <strong>{money(real(current).per1000)}</strong>
                <div style={{ fontSize: '0.62rem', fontWeight: 700 }}>real /1000 msj</div>
                <div style={{ fontSize: '0.55rem' }}>({real(current).calls} llamadas con este modelo)</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Buscador */}
      <input className="note-input" value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder='Buscar: "gemini", "google", o el slug completo…' />

      {/* Fila 1: empresa, orden, agrupar */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '0.6rem 0' }}>
        <select className="note-input" style={{ flex: 1, minWidth: '150px' }} value={provider} onChange={(e) => setProvider(e.target.value)}>
          <option value="all">Todas las empresas ({models.length})</option>
          {providers.map(([p, n]) => <option key={p} value={p}>{p} ({n})</option>)}
        </select>
        <select className="note-input" style={{ flex: 1, minWidth: '150px' }} value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <label className="mp-check">
          <input type="checkbox" checked={groupByProvider} onChange={(e) => setGroupByProvider(e.target.checked)} /> Agrupar
        </label>
      </div>

      {/* Fila 2: capacidades y límites */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.6rem' }}>
        <label className="mp-check"><input type="checkbox" checked={f.tools} onChange={(e) => setF({ ...f, tools: e.target.checked })} /> 🔧 Con herramientas</label>
        <label className="mp-check"><input type="checkbox" checked={f.cache} onChange={(e) => setF({ ...f, cache: e.target.checked })} /> ⚡ Con caché</label>
        <label className="mp-check"><input type="checkbox" checked={f.free} onChange={(e) => setF({ ...f, free: e.target.checked })} /> 🆓 Gratis</label>
        <label className="mp-check"><input type="checkbox" checked={f.images} onChange={(e) => setF({ ...f, images: e.target.checked })} /> 🖼️ Ve imágenes</label>
        <input className="mini-input" style={{ maxWidth: '150px' }} type="number" step="0.01" min="0" value={f.maxCost}
          onChange={(e) => setF({ ...f, maxCost: e.target.value })} placeholder="Hasta $X / 1000 msj" />
        <input className="mini-input" style={{ maxWidth: '140px' }} type="number" min="0" value={f.minContext}
          onChange={(e) => setF({ ...f, minContext: e.target.value })} placeholder="Contexto mín. (K)" />
        <button className="link-btn" onClick={() => { setF(DEFAULT_FILTERS); setProvider('all'); setSearch(''); }}>
          Quitar filtros
        </button>
      </div>

      <p className="muted" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>
        {filtered.length} modelo(s). Ordenado por <strong>costo real</strong>: {inTok} tokens de entrada + {outTok} de salida por mensaje
        {usageStats?.calls
          ? <> — <strong>tu carga real promedio</strong> ({usageStats.calls} llamadas)</>
          : <> (estimado; aún no hay historial de consumo)</>}
        , igual para todos para que el precio sea lo único que cambie. Los modelos con caché no repagan la entrada.
        {' '}Un modelo que nunca usaste <strong>solo se puede estimar</strong>; los que sí corriste muestran además su costo <strong>real medido</strong>.
      </p>

      {/* Lista */}
      <div style={{ maxHeight: '520px', overflowY: 'auto', border: '3px solid #000', padding: '0.6rem', background: '#f4f4f4' }}>
        {filtered.length === 0 && <p className="muted">Ningún modelo cumple esos filtros.</p>}
        {grouped
          ? grouped.map(([p, list]) => (
              <div key={p} style={{ marginBottom: '0.8rem' }}>
                <h4 style={{ margin: '0.4rem 0', fontSize: '0.8rem' }}>{p} ({list.length})</h4>
                {list.map(Card)}
              </div>
            ))
          : filtered.map(Card)}
      </div>
    </div>
  );
};

export default ModelPicker;
