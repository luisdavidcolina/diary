import React, { useState, useEffect } from 'react';
import {
  addTransaction, getTransactions, addOrUpdateAccount, getAccounts,
  deleteTransaction, deleteAccount
} from '../services/db';

const inputStyle = { padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white' };

// Reglas del presupuesto 50/30/20.
const BUCKETS = [
  { key: 'need', label: 'Necesidades', pct: 0.5, color: 'var(--color-cloud)' },
  { key: 'want', label: 'Deseos', pct: 0.3, color: 'var(--color-security)' },
  { key: 'saving', label: 'Ahorro', pct: 0.2, color: 'var(--accent-color)' }
];
const CAT_LABEL = { need: 'Necesidad', want: 'Deseo', saving: 'Ahorro' };

const Finance = () => {
  const [rates, setRates] = useState({ bcv: 0, binance: 0 });
  const [loadingRates, setLoadingRates] = useState(true);

  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);

  // Transacciones
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('need');

  // Cuentas (con edición)
  const [accName, setAccName] = useState('');
  const [accCurrency, setAccCurrency] = useState('BS');
  const [accBalance, setAccBalance] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchRates();
    loadTransactions();
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try { setAccounts(await getAccounts()); } catch (e) { console.error(e); }
  };
  const loadTransactions = async () => {
    try { setTransactions(await getTransactions()); } catch (e) { console.error(e); }
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
      await addTransaction(amount, desc, type, type === 'expense' ? category : null);
      setAmount(''); setDesc('');
      loadTransactions();
    } catch (e) { console.error(e); }
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

      {/* PRESUPUESTO 50/30/20 */}
      <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2>Presupuesto del mes (50/30/20)</h2>
          <span style={{ color: 'var(--text-secondary)' }}>
            Ingresos: <strong style={{ color: '#10b981' }}>${income.toFixed(2)}</strong> · Gastos:{' '}
            <strong style={{ color: '#ef4444' }}>${expenses.toFixed(2)}</strong> · Balance:{' '}
            <strong style={{ color: income - expenses >= 0 ? '#10b981' : '#ef4444' }}>${(income - expenses).toFixed(2)}</strong>
          </span>
        </div>
        {income === 0 ? (
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
            Registra un <strong>ingreso</strong> este mes para calcular tu presupuesto.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.25rem' }}>
            {BUCKETS.map((b) => {
              const budget = income * b.pct;
              const spent = spentBy(b.key);
              const ratio = budget > 0 ? spent / budget : 0;
              const over = spent > budget;
              return (
                <div key={b.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                    <span>{b.label} <span style={{ color: 'var(--text-secondary)' }}>({b.pct * 100}%)</span></span>
                    <span style={{ color: over ? '#ef4444' : 'var(--text-secondary)' }}>
                      ${spent.toFixed(2)} / ${budget.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ height: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(100, ratio * 100)}%`, height: '100%',
                      background: over ? '#ef4444' : b.color, transition: 'width 0.6s ease'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <select value={type} onChange={(e) => setType(e.target.value)} style={inputStyle}>
                <option value="expense">Gasto (-)</option>
                <option value="income">Ingreso (+)</option>
              </select>
              {type === 'expense' && (
                <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
                  <option value="need">Necesidad</option>
                  <option value="want">Deseo</option>
                  <option value="saving">Ahorro</option>
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
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>· {CAT_LABEL[t.category]}</span>
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
    </div>
  );
};

export default Finance;
