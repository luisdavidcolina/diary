import React, { useState, useEffect } from 'react';
import {
  addTransaction, getTransactions, addOrUpdateAccount, getAccounts,
  deleteTransaction, deleteAccount, getFinanceLimits, saveFinanceLimits, uploadReceiptImage
} from '../services/db';

const inputStyle = { padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white' };

const FINANCE_CATEGORIES = [
  { id: 'house', label: 'Gastos de casa', icon: '🏠', defaultLimit: 200, color: '#3b82f6' },
  { id: 'food_out', label: 'Comida / Delivery', icon: '🍔', defaultLimit: 50, color: '#f59e0b' },
  { id: 'transport', label: 'Movilidad / Taxi', icon: '🚕', defaultLimit: 40, color: '#10b981' },
  { id: 'recreation', label: 'Recreación / Salidas', icon: '🎬', defaultLimit: 50, color: '#8b5cf6' },
  { id: 'remittances', label: 'Remesas', icon: '💸', defaultLimit: 100, color: '#ec4899' },
  { id: 'other', label: 'Otros / Casos raros', icon: '❓', defaultLimit: 50, color: '#64748b' }
];

const Finance = () => {
  const [rates, setRates] = useState({ bcv: 0, binance: 0 });
  const [loadingRates, setLoadingRates] = useState(true);

  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  
  // Limites
  const [limits, setLimits] = useState({});
  const [showLimitsModal, setShowLimitsModal] = useState(false);
  const [tempLimits, setTempLimits] = useState({});

  // Transacciones
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('house');
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState(null);

  // Cuentas (con edición)
  const [accName, setAccName] = useState('');
  const [accCurrency, setAccCurrency] = useState('BS');
  const [accBalance, setAccBalance] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [dbError, setDbError] = useState(null);

  useEffect(() => {
    fetchRates();
    loadTransactions();
    loadAccounts();
    loadLimits();
  }, []);

  const loadLimits = async () => {
    try {
      const data = await getFinanceLimits();
      if (data) {
        setLimits(data);
      } else {
        const def = {};
        FINANCE_CATEGORIES.forEach(c => def[c.id] = c.defaultLimit);
        setLimits(def);
        await saveFinanceLimits(def);
      }
    } catch (e) { console.error(e); }
  };

  const loadAccounts = async () => {
    try { setDbError(null); setAccounts(await getAccounts()); } catch (e) { console.error(e); setDbError(e.message || "Error de red o permisos al leer base de datos."); }
  };
  const loadTransactions = async () => {
    try { setDbError(null); setTransactions(await getTransactions()); } catch (e) { console.error(e); setDbError(e.message || "Error de red o permisos al leer base de datos."); }
  };

  const fetchRates = async () => {
    try {
      const cached = localStorage.getItem('exchange_rates');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (new Date().getTime() - timestamp < 4 * 60 * 60 * 1000) {
          setRates(data); setLoadingRates(false); return;
        }
      }
      const res = await fetch("https://pydolarvenezuela-api.vercel.app/api/v1/dollar");
      const json = await res.json();
      const newRates = { bcv: json.monitors?.bcv?.price || 0, binance: json.monitors?.binance?.price || 0 };
      setRates(newRates);
      localStorage.setItem('exchange_rates', JSON.stringify({ data: newRates, timestamp: new Date().getTime() }));
    } catch (error) {
      console.error("Error obteniendo tasas:", error);
    } finally {
      setLoadingRates(false);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!amount || !desc) return;
    try {
      await addTransaction(amount, desc, type, type === 'expense' ? category : null, receiptUrl);
      setAmount(''); setDesc(''); setReceiptUrl(null);
      loadTransactions();
    } catch (e) { console.error(e); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsProcessingReceipt(true);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
      });

      // 1. Subir a Telegram
      const uploadRes = await fetch('/api/upload-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 })
      });
      const uploadJson = await uploadRes.json();
      if (!uploadJson.success) throw new Error(uploadJson.error);
      
      setReceiptUrl(uploadJson.fileId); // Aquí guardamos el fileId
      
      // 2. Extraer datos con IA
      const res = await fetch('/api/process-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: base64 })
      });
      const json = await res.json();
      if (json.success) {
        setAmount(String(json.data.amount));
        setDesc(json.data.description);
        if (json.data.type === 'income' || json.data.type === 'expense') {
          setType(json.data.type);
        }
      } else {
        alert("Error de IA: " + json.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error procesando imagen: " + err.message);
    } finally {
      setIsProcessingReceipt(false);
    }
  };

  const startEdit = (acc) => {
    setEditingId(acc.id);
    setAccName(acc.name);
    setAccCurrency(acc.currency);
    setAccBalance(String(acc.balance));
  };
  const cancelEdit = () => {
    setEditingId(null); setAccName(''); setAccBalance('');
  };
  const handleSaveAccount = async (e) => {
    e.preventDefault();
    if (!accName || !accBalance) return;
    try {
      await addOrUpdateAccount(editingId, accName, accCurrency, accBalance);
      cancelEdit();
      loadAccounts();
    } catch (e) { console.error(e); }
  };

  const handleDeleteAccount = async (id) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    try { await deleteAccount(id); } catch (e) { console.error(e); loadAccounts(); }
  };
  const handleDeleteTransaction = async (id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    try { await deleteTransaction(id); } catch (e) { console.error(e); loadTransactions(); }
  };

  // --- Patrimonio neto (desde cuentas) ---
  let totalUSD = 0, totalBS = 0;
  accounts.forEach((acc) => {
    if (acc.currency === 'USD') {
      totalUSD += acc.balance;
      if (rates.binance) totalBS += acc.balance * rates.binance;
    } else {
      totalBS += acc.balance;
      if (rates.bcv) totalUSD += acc.balance / rates.bcv;
    }
  });

  // --- Resumen del mes actual (desde transacciones, en USD) ---
  const now = new Date();
  const isThisMonth = (iso) => {
    const d = new Date(iso);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };
  const monthTx = transactions.filter((t) => isThisMonth(t.createdAt));
  const income = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
  const expenses = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
  const spentBy = (cat) => monthTx.filter((t) => t.type === 'expense' && t.category === cat).reduce((s, t) => s + parseFloat(t.amount), 0);

  return (
    <div style={{ animation: 'fadeInUp 0.6s ease' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="text-gradient">Finanzas Personales</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Controla tu presupuesto y sigue las tasas del día.</p>
      </header>

      {dbError && (
        <div style={{ padding: '1rem 1.5rem', marginBottom: '2rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', color: '#fca5a5' }}>
           <strong>Error de Conexión:</strong> {dbError}
           <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: '#f87171' }}>Sugerencia: Si usas bloqueadores de anuncios (ej. Brave Shields), intenta desactivarlos para esta página.</p>
        </div>
      )}

      {/* PATRIMONIO Y TASAS */}
      <div className="grid" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ textAlign: 'center', borderColor: 'var(--accent-color)', gridColumn: '1 / -1', padding: '1.5rem' }}>
          <h2 style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1rem' }}>Patrimonio Neto Total</h2>
          <h1 style={{ fontSize: '3rem', margin: '0.5rem 0', color: 'var(--accent-color)' }}>${totalUSD.toFixed(2)}</h1>
          <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>≈ Bs. {totalBS.toFixed(2)}</span>
        </div>
        <div className="glass-panel" style={{ textAlign: 'center', borderColor: 'var(--color-cloud)', padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-secondary)' }}>Tasa BCV</h3>
          <h2 style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>{loadingRates ? 'Cargando...' : `Bs. ${rates.bcv.toFixed(2)}`}</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-cloud)' }}>Oficial</span>
        </div>
        <div className="glass-panel" style={{ textAlign: 'center', borderColor: 'var(--color-security)', padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-secondary)' }}>Binance P2P</h3>
          <h2 style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>{loadingRates ? 'Cargando...' : `Bs. ${rates.binance.toFixed(2)}`}</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-security)' }}>Promedio</span>
        </div>
      </div>

      {/* CONTROL DE PRESUPUESTOS */}
      <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2>Presupuesto Mensual por Categorías</h2>
          <button 
            onClick={() => { setTempLimits(limits); setShowLimitsModal(true); }}
            style={{ background: 'var(--glass-border)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={(e) => e.target.style.background = 'var(--glass-border)'}
          >
            ⚙️ Ajustar Límites
          </button>
        </div>
        <div style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Ingresos: <strong style={{ color: '#10b981' }}>${income.toFixed(2)}</strong> · Gastos:{' '}
          <strong style={{ color: '#ef4444' }}>${expenses.toFixed(2)}</strong> · Balance:{' '}
          <strong style={{ color: income - expenses >= 0 ? '#10b981' : '#ef4444' }}>${(income - expenses).toFixed(2)}</strong>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
          {FINANCE_CATEGORIES.map((cat) => {
            const limit = limits[cat.id] || cat.defaultLimit;
            const spent = spentBy(cat.id);
            const ratio = limit > 0 ? spent / limit : 0;
            const over = spent > limit;
            return (
              <div key={cat.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                  <span>{cat.icon} {cat.label}</span>
                  <span style={{ color: over ? '#ef4444' : 'var(--text-secondary)', fontWeight: over ? 'bold' : 'normal' }}>
                    ${spent.toFixed(2)} / ${limit.toFixed(2)}
                  </span>
                </div>
                <div style={{ height: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, ratio * 100)}%`, height: '100%',
                    background: over ? '#ef4444' : cat.color, transition: 'width 0.6s ease',
                    boxShadow: over ? '0 0 8px #ef4444' : 'none'
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CUENTAS Y WALLETS */}
      <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <h2>{editingId ? 'Editar cuenta' : 'Mis Cuentas y Wallets'}</h2>
        <form onSubmit={handleSaveAccount} style={{ display: 'flex', gap: '1rem', marginTop: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input type="text" placeholder="Nombre (ej. Mercantil, Binance)" value={accName} onChange={(e) => setAccName(e.target.value)} required style={{ ...inputStyle, flex: 2, minWidth: '160px' }} />
          <select value={accCurrency} onChange={(e) => setAccCurrency(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
            <option value="BS">Bolívares (BS)</option>
            <option value="USD">Dólares (USD/USDT)</option>
          </select>
          <input type="number" step="0.01" placeholder="Saldo Actual" value={accBalance} onChange={(e) => setAccBalance(e.target.value)} required style={{ ...inputStyle, flex: 1, minWidth: '120px' }} />
          <button type="submit" style={{ background: 'var(--accent-color)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            {editingId ? 'Guardar cambios' : '+ Añadir'}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)', padding: '0.75rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>
              Cancelar
            </button>
          )}
        </form>

        <div className="grid">
          {accounts.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Aún no tienes cuentas registradas.</p>}
          {accounts.map((acc) => (
            <div key={acc.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', borderLeft: `4px solid ${acc.currency === 'USD' ? 'var(--color-security)' : 'var(--color-cloud)'}`, position: 'relative' }}>
              <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.4rem' }}>
                <button onClick={() => startEdit(acc)} title="Editar" style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>✏️</button>
                <button onClick={() => handleDeleteAccount(acc.id)} title="Eliminar" style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>🗑</button>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{acc.name}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{acc.currency === 'USD' ? '$' : 'Bs. '}{acc.balance.toFixed(2)}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                ≈ {acc.currency === 'USD' ? `Bs. ${(acc.balance * rates.binance).toFixed(2)}` : `$${rates.bcv ? (acc.balance / rates.bcv).toFixed(2) : 0}`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TRANSACCIONES */}
      <div className="grid">
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2>Registrar Transacción</h2>
          <form onSubmit={handleAddTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <label style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'background 0.2s' }} onMouseOver={e=>e.currentTarget.style.background='rgba(255,255,255,0.2)'} onMouseOut={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}>
                {isProcessingReceipt ? '⏳ Analizando...' : '📷 Escanear Comprobante (IA)'}
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} disabled={isProcessingReceipt} />
              </label>
              {receiptUrl && !isProcessingReceipt && <span style={{ color: '#10b981', fontSize: '0.8rem' }}>✅ Listo</span>}
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <select value={type} onChange={(e) => setType(e.target.value)} style={inputStyle}>
                <option value="expense">Gasto (-)</option>
                <option value="income">Ingreso (+)</option>
              </select>
              {type === 'expense' && (
                <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
                  {FINANCE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                </select>
              )}
              <input type="number" step="0.01" placeholder="Monto ($)" value={amount} onChange={(e) => setAmount(e.target.value)} required style={{ ...inputStyle, flex: 1, minWidth: '100px' }} />
            </div>
            <input type="text" placeholder="Descripción (ej. Café, Transporte)" value={desc} onChange={(e) => setDesc(e.target.value)} required style={{ ...inputStyle, width: '100%' }} />
            <button type="submit" style={{ background: type === 'expense' ? '#ef4444' : '#10b981', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              Guardar
            </button>
          </form>
        </div>

        <div className="glass-panel" style={{ maxHeight: '400px', overflowY: 'auto', padding: '1.5rem' }}>
          <h2>Historial Reciente</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            {transactions.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No hay transacciones aún.</p>}
            {transactions.map((t) => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', borderLeft: `4px solid ${t.type === 'expense' ? '#ef4444' : '#10b981'}` }}>
                <span style={{ flex: 1 }}>
                  {t.description}
                  {t.type === 'expense' && t.category && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                      · {FINANCE_CATEGORIES.find(c => c.id === t.category)?.label || t.category}
                    </span>
                  )}
                  {t.telegramFileId && (
                    <a href={`/api/telegram-image?id=${t.telegramFileId}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', marginLeft: '0.5rem', color: 'var(--accent-color)', textDecoration: 'none' }}>
                      📷 Ver
                    </a>
                  )}
                </span>
                <span style={{ fontWeight: 'bold', color: t.type === 'expense' ? '#ef4444' : '#10b981' }}>
                  {t.type === 'expense' ? '-' : '+'}${parseFloat(t.amount).toFixed(2)}
                </span>
                <button onClick={() => handleDeleteTransaction(t.id)} title="Eliminar" style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>🗑</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL DE LÍMITES */}
      {showLimitsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
          <div className="glass-panel" style={{ padding: '2rem', width: '90%', maxWidth: '400px', animation: 'fadeInUp 0.3s ease' }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--accent-color)' }}>Ajustar Límites Mensuales</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {FINANCE_CATEGORIES.map(cat => (
                <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.95rem' }}>{cat.icon} {cat.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>$</span>
                    <input 
                      type="number" 
                      value={tempLimits[cat.id] ?? cat.defaultLimit}
                      onChange={(e) => setTempLimits({ ...tempLimits, [cat.id]: parseFloat(e.target.value) || 0 })}
                      style={{ ...inputStyle, width: '90px', padding: '0.4rem', textAlign: 'right' }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button 
                onClick={() => setShowLimitsModal(false)} 
                style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button 
                onClick={async () => {
                  setLimits(tempLimits);
                  await saveFinanceLimits(tempLimits);
                  setShowLimitsModal(false);
                }} 
                style={{ background: 'var(--accent-color)', color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
