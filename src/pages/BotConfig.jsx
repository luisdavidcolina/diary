import React, { useEffect, useState } from 'react';
import {
  getBotConfig, saveBotConfig, DEFAULT_BOT_CONFIG,
  queryCollection, createRecord, deleteRecord, updateRecord,
  getChatMessages, getApiUsageLogs
} from '../services/db';
import ReactMarkdown from 'react-markdown';

const TONES = [
  { id: 'cercano', label: '🤝 Cercano' },
  { id: 'directo', label: '🎯 Directo' },
  { id: 'formal', label: '👔 Formal' },
  { id: 'motivador', label: '🔥 Motivador' },
  { id: 'gracioso', label: '😏 Gracioso' }
];
const LENGTHS = [
  { id: 'corto', label: 'Corto' },
  { id: 'medio', label: 'Medio' },
  { id: 'detallado', label: 'Detallado' }
];

const BotConfig = () => {
  const [activeTab, setActiveTab] = useState('config'); // 'config', 'chats', 'api'
  
  const [cfg, setCfg] = useState(DEFAULT_BOT_CONFIG);
  const [knowledge, setKnowledge] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [apiLogs, setApiLogs] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newRule, setNewRule] = useState('');
  const [kTitle, setKTitle] = useState('');
  const [kContent, setKContent] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setCfg(await getBotConfig());
        setKnowledge(await queryCollection('bot_knowledge'));
        setChatHistory(await getChatMessages());
        setApiLogs(await getApiUsageLogs());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = (patch) => { setCfg((c) => ({ ...c, ...patch })); setSaved(false); };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveBotConfig(cfg);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error(e);
      alert('Error guardando: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const addRule = () => {
    if (!newRule.trim()) return;
    set({ customRules: [...(cfg.customRules || []), newRule.trim()] });
    setNewRule('');
  };
  const removeRule = (i) => set({ customRules: cfg.customRules.filter((_, idx) => idx !== i) });

  const addKnowledge = async (e) => {
    e.preventDefault();
    if (!kTitle.trim() || !kContent.trim()) return;
    try {
      await createRecord('bot_knowledge', { title: kTitle.trim(), content: kContent.trim(), always: true });
      setKTitle(''); setKContent('');
      setKnowledge(await queryCollection('bot_knowledge'));
    } catch (e) { console.error(e); }
  };
  const toggleAlways = async (k) => {
    const next = k.always === false;
    setKnowledge((prev) => prev.map((x) => (x.id === k.id ? { ...x, always: next } : x)));
    try { await updateRecord('bot_knowledge', k.id, { always: next }); } catch (e) { console.error(e); }
  };
  const removeKnowledge = async (id) => {
    setKnowledge((prev) => prev.filter((x) => x.id !== id));
    try { await deleteRecord('bot_knowledge', id); } catch (e) { console.error(e); }
  };

  if (loading) return <p className="muted" style={{ padding: '2rem' }}>Cargando datos de Luisda Bot…</p>;

  return (
    <div style={{ animation: 'fadeInUp 0.6s ease', maxWidth: '900px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="text-gradient">🧠 Panel de Luisda Bot</h1>
        <p className="muted">Define su personalidad, revisa el histórico de conversaciones y audita el consumo de API.</p>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '4px solid #000', overflowX: 'auto', paddingBottom: '2px' }}>
        <button onClick={() => setActiveTab('config')} style={{ background: activeTab === 'config' ? 'var(--brutal-yellow)' : '#eee', border: 'none', borderTop: '4px solid #000', borderRight: '4px solid #000', borderLeft: '4px solid #000', padding: '0.75rem 1.5rem', fontWeight: 900, cursor: 'pointer', fontSize: '1rem', whiteSpace: 'nowrap' }}>🧠 Cerebro</button>
        <button onClick={() => setActiveTab('chats')} style={{ background: activeTab === 'chats' ? 'var(--brutal-pink)' : '#eee', border: 'none', borderTop: '4px solid #000', borderRight: '4px solid #000', borderLeft: '4px solid #000', padding: '0.75rem 1.5rem', fontWeight: 900, cursor: 'pointer', fontSize: '1rem', whiteSpace: 'nowrap' }}>💬 Chats</button>
        <button onClick={() => setActiveTab('api')} style={{ background: activeTab === 'api' ? 'var(--brutal-green)' : '#eee', border: 'none', borderTop: '4px solid #000', borderRight: '4px solid #000', borderLeft: '4px solid #000', padding: '0.75rem 1.5rem', fontWeight: 900, cursor: 'pointer', fontSize: '1rem', whiteSpace: 'nowrap' }}>💸 Consumo API</button>
      </div>

      {activeTab === 'config' && (
        <div style={{ animation: 'fadeInUp 0.4s ease' }}>
          {/* Identidad y estilo */}
          <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h2 style={{ marginTop: 0 }}>Identidad</h2>

            <label className="cfg-label">Nombre del bot</label>
            <input className="note-input" value={cfg.botName} onChange={(e) => set({ botName: e.target.value })} placeholder="Luisda Bot" />

            <label className="cfg-label">Personalidad (cómo es y cómo habla)</label>
            <textarea
              className="note-input" rows="4"
              value={cfg.persona}
              onChange={(e) => set({ persona: e.target.value })}
              placeholder="Ej: Eres como yo: directo, con humor seco, odias el relleno. Me tuteas, me empujas cuando procrastino y no me sermoneas."
            />

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
              <div style={{ flex: 1, minWidth: '160px' }}>
                <label className="cfg-label">Tono</label>
                <select className="note-input" value={cfg.tone} onChange={(e) => set({ tone: e.target.value })}>
                  {TONES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: '160px' }}>
                <label className="cfg-label">Longitud</label>
                <select className="note-input" value={cfg.responseLength} onChange={(e) => set({ responseLength: e.target.value })}>
                  {LENGTHS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-end', paddingBottom: '0.7rem' }}>
                <input type="checkbox" checked={cfg.useEmojis} onChange={(e) => set({ useEmojis: e.target.checked })} style={{ width: 18, height: 18, accentColor: 'var(--accent-color)' }} />
                Usar emojis
              </label>
            </div>
          </div>

          {/* Perfil del dueño */}
          <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h2 style={{ marginTop: 0 }}>Sobre ti</h2>
            <p className="muted" style={{ marginBottom: '0.75rem', fontSize: '0.9rem' }}>Quién eres, cómo quieres que te trate, qué te motiva. El bot se adapta a esto.</p>
            <textarea
              className="note-input" rows="5"
              value={cfg.ownerProfile}
              onChange={(e) => set({ ownerProfile: e.target.value })}
              placeholder="Ej: Soy Luisdavid, estudiante de Computación en la UCV. Trabajo mientras estudio, así que valoro que me ahorres tiempo. Procrastino con Cálculo. Prefiero que me des la respuesta directa antes que opciones."
            />
          </div>

          {/* Reglas */}
          <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h2 style={{ marginTop: 0 }}>Reglas personalizadas</h2>
            <div className="card-form">
              <input className="mini-input" value={newRule} onChange={(e) => setNewRule(e.target.value)}
                placeholder="Ej: Nunca me des respuestas de más de 5 líneas"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRule(); } }} />
              <button className="ghost-btn" onClick={addRule}>+ Añadir</button>
            </div>
            {(cfg.customRules || []).length === 0 ? (
              <p className="muted">Sin reglas todavía.</p>
            ) : (
              <ul className="mini-list">
                {cfg.customRules.map((r, i) => (
                  <li key={i}><span>{r}</span><button className="icon-btn" onClick={() => removeRule(i)}>✕</button></li>
                ))}
              </ul>
            )}
          </div>

          {/* Base de conocimiento */}
          <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h2 style={{ marginTop: 0 }}>Bases de conocimiento</h2>
            <p className="muted" style={{ marginBottom: '0.75rem', fontSize: '0.9rem' }}>
              Datos que el bot debe saber siempre. Si desactivas <strong>Siempre</strong>, solo los consulta cuando hagan falta (ahorra tokens).
            </p>
            <form onSubmit={addKnowledge} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
              <input className="mini-input" value={kTitle} onChange={(e) => setKTitle(e.target.value)} placeholder="Título (ej. Mi horario de clases)" />
              <textarea className="note-input" rows="3" value={kContent} onChange={(e) => setKContent(e.target.value)} placeholder="Contenido (ej. Lunes y miércoles 11am-1pm teoría; viernes práctica)" />
              <button type="submit" className="ghost-btn" style={{ alignSelf: 'flex-start' }}>+ Añadir conocimiento</button>
            </form>
            {knowledge.length === 0 ? (
              <p className="muted">Sin conocimientos guardados.</p>
            ) : (
              <ul className="mini-list">
                {knowledge.map((k) => (
                  <li key={k.id} style={{ alignItems: 'flex-start' }}>
                    <span style={{ flex: 1 }}>
                      <strong>{k.title}</strong>
                      <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{k.content}</span>
                    </span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <input type="checkbox" checked={k.always !== false} onChange={() => toggleAlways(k)} style={{ accentColor: 'var(--accent-color)' }} />
                      Siempre
                    </label>
                    <button className="icon-btn" onClick={() => removeKnowledge(k.id)}>🗑</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
            <button className="primary-btn" style={{ background: 'var(--accent-color)' }} onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando…' : '💾 Guardar cerebro'}
            </button>
            {saved && <span style={{ color: '#22c55e' }}>✓ Guardado — ya aplica en la web y en Telegram</span>}
          </div>
        </div>
      )}

      {activeTab === 'chats' && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', animation: 'fadeInUp 0.4s ease' }}>
          <h2 style={{ marginTop: 0 }}>Historial de Conversaciones</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {chatHistory.length === 0 ? <p className="muted">No hay mensajes guardados en el historial web.</p> : null}
            {chatHistory.map((msg, i) => {
              if (msg.role === 'function') return null;
              const isUser = msg.role === 'user';
              return (
                <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                  <div style={{ 
                    background: isUser ? 'var(--brutal-green)' : 'var(--brutal-white)',
                    padding: '1rem', border: '3px solid #000', boxShadow: '4px 4px 0 #000',
                    maxWidth: '80%', wordBreak: 'break-word', fontWeight: 600
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#000', marginBottom: '0.5rem', borderBottom: '2px solid #000', paddingBottom: '4px' }}>
                      <strong>{isUser ? 'Tú' : 'Luisda Bot'}</strong> - {new Date(msg.createdAt).toLocaleString()}
                    </div>
                    {msg.type === 'proposal' ? `[Propuesta de Herramienta] ${msg.functionCall?.name}` : <ReactMarkdown>{msg.content}</ReactMarkdown>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'api' && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', animation: 'fadeInUp 0.4s ease' }}>
          <h2 style={{ marginTop: 0 }}>Historial de Consumo (Tokens)</h2>
          <p className="muted" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>Control detallado del gasto de tokens por consulta en la API de Inteligencia Artificial.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {apiLogs.length === 0 ? <p className="muted">No hay consumos registrados recientemente.</p> : null}
            {apiLogs.map(log => (
              <div key={log.id} style={{ border: '3px solid #000', padding: '1rem', background: 'var(--brutal-white)', boxShadow: '4px 4px 0 #000' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 800 }}>
                  <span>{new Date(log.createdAt).toLocaleString()}</span>
                  <span style={{ color: 'var(--brutal-blue)' }}>${Number(log.cost).toFixed(5)}</span>
                </div>
                <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                  <span style={{ background: '#eee', padding: '2px 4px', border: '1px solid #000', marginRight: '4px' }}>Origen: {log.source}</span>
                  <span style={{ background: '#eee', padding: '2px 4px', border: '1px solid #000' }}>Tokens: {log.total_tokens || '?'} (P:{log.prompt_tokens || '?'} C:{log.completion_tokens || '?'})</span>
                </div>
                <div style={{ fontSize: '0.9rem', fontStyle: 'italic', color: '#444', wordBreak: 'break-word', borderLeft: '4px solid var(--brutal-pink)', paddingLeft: '0.5rem' }}>
                  "{log.promptPreview || 'Sin prompt'}"
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default BotConfig;
