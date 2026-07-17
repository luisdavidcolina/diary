import React, { useState, useEffect } from 'react';
import {
  addTransaction, getTransactions, addOrUpdateAccount, getAccounts,
  deleteTransaction, deleteAccount, getFinanceLimits, saveFinanceLimits, uploadReceiptImage
} from '../services/db';

const inputStyle = { padding: '0.75rem', borderRadius: '0', background: '#fff', border: '3px solid #000', color: '#000', fontWeight: 600, boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.1)' };

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

  const formatNum = (val) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parseFloat(val) || 0);
  
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
  const [receiptUrls, setReceiptUrls] = useState([]);
  const [txCurrency, setTxCurrency] = useState('USD');
  const [txAccountId, setTxAccountId] = useState('');
  const [txCreatedAt, setTxCreatedAt] = useState('');
  const [txRate, setTxRate] = useState('');

  // Cuentas (con edición)
  const [accName, setAccName] = useState('');
  const [accCurrency, setAccCurrency] = useState('BS');
  const [accBalance, setAccBalance] = useState('');
  const [accNumber, setAccNumber] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [dbError, setDbError] = useState(null);
  const [isAccountsExpanded, setIsAccountsExpanded] = useState(false);

  useEffect(() => {
    window.importMyAccounts = async () => {
      await addOrUpdateAccount(null, 'Cuenta Corriente Amiga', 'BS', 112952.89, '01720116671165034610');
      await addOrUpdateAccount(null, 'Bancamiga Cash USD', 'USD', 0, '01720116681165037787');
      await addOrUpdateAccount(null, 'BCP Cuentas de Ahorro Soles', 'PEN', 1.22, '19493427507017');
      await addOrUpdateAccount(null, 'BCP Corriente Soles', 'PEN', 1.00, '5159049815090');
      await addOrUpdateAccount(null, 'BCP Cuentas de Ahorro USD', 'USD', 1.21, '19301908973153');
      await addOrUpdateAccount(null, 'Mercantil Cta. Corriente', 'BS', 348.36, '01050020641020656670');
      await addOrUpdateAccount(null, 'BDV Cuenta Corriente', 'BS', 95.68, '01020727440000259550');
      await addOrUpdateAccount(null, 'Binance USDT', 'USD', 324.29, '');
      loadAccounts();
      console.log('¡Cuentas importadas con éxito!');
    };
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
      const res = await fetch("/api/rates");
      const json = await res.json();
      const newRates = { bcv: json.bcv || 0, binance: json.binance || 0 };
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
      const opts = {
        currency: txCurrency,
        rate: txCurrency === 'VES' ? parseFloat(txRate) || rates.bcv || 1 : null,
        accountId: txAccountId || null,
        createdAt: txCreatedAt ? new Date(txCreatedAt).toISOString() : null
      };
      await addTransaction(amount, desc, type, type === 'expense' ? category : null, receiptUrls, opts);
      setAmount(''); 
      setDesc(''); 
      setReceiptUrls([]);
      setTxAccountId('');
      setTxCreatedAt('');
      setTxRate('');
      setTxCurrency('USD');
      loadTransactions();
      loadAccounts();
    } catch (e) { console.error(e); }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setIsProcessingReceipt(true);
    try {
      const newUrls = [];
      for (const file of files) {
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
        
        newUrls.push(uploadJson.fileId); // Aquí guardamos el fileId
        
        // 2. Extraer datos con IA (solo para la primera imagen si es un lote)
        if (newUrls.length === 1) {
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
          }
        }
      }
      setReceiptUrls(prev => [...prev, ...newUrls]);
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
    setAccNumber(acc.accountNumber || '');
  };
  const cancelEdit = () => {
    setEditingId(null); setAccName(''); setAccBalance(''); setAccNumber('');
  };
  const handleSaveAccount = async (e) => {
    e.preventDefault();
    if (!accName || !accBalance) return;
    try {
      await addOrUpdateAccount(editingId, accName, accCurrency, accBalance, accNumber);
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
    } else if (acc.currency === 'PEN') {
      const usdValue = acc.balance / 3.75;
      totalUSD += usdValue;
      if (rates.binance) totalBS += usdValue * rates.binance;
    } else {
      totalBS += acc.balance;
      const bsRate = rates.binance || rates.bcv || 1;
      totalUSD += acc.balance / bsRate;
    }
  });

  // Ordenar cuentas por su valor real equivalente en USD (de mayor a menor)
  const sortedAccounts = [...accounts].sort((a, b) => {
    const valA = a.currency === 'USD' ? a.balance : (a.currency === 'PEN' ? a.balance / 3.75 : a.balance / (rates.binance || rates.bcv || 1));
    const valB = b.currency === 'USD' ? b.balance : (b.currency === 'PEN' ? b.balance / 3.75 : b.balance / (rates.binance || rates.bcv || 1));
    return valB - valA;
  });

  // --- Resumen del mes actual (desde transacciones, en USD) ---
  const now = new Date();
  const isThisMonth = (iso) => {
    const d = new Date(iso);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };
  const monthTx = transactions.filter((t) => isThisMonth(t.createdAt));
  const income = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + parseFloat(t.amountUSD != null ? t.amountUSD : t.amount || 0), 0);
  const expenses = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amountUSD != null ? t.amountUSD : t.amount || 0), 0);
  const spentBy = (cat) => monthTx.filter((t) => t.type === 'expense' && t.category === cat).reduce((s, t) => s + parseFloat(t.amountUSD != null ? t.amountUSD : t.amount || 0), 0);

  return (
    <div style={{ animation: 'fadeInUp 0.6s ease' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="text-gradient">Finanzas Personales</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Controla tu presupuesto y sigue las tasas del día.</p>
      </header>

      {dbError && (
        <div style={{ padding: '1rem 1.5rem', marginBottom: '2rem', background: '#fca5a5', border: '3px solid #000', borderRadius: '0', color: '#000', boxShadow: '4px 4px 0 #000' }}>
           <strong>Error de Conexión:</strong> {dbError}
           <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: '#000', fontWeight: 600 }}>Sugerencia: Si usas bloqueadores de anuncios (ej. Brave Shields), intenta desactivarlos para esta página.</p>
        </div>
      )}

      {/* PATRIMONIO Y TASAS */}
      <div className="grid" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ textAlign: 'center', borderColor: 'var(--accent-color)', gridColumn: '1 / -1', padding: '1.5rem' }}>
          <h2 style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1rem' }}>Patrimonio Neto Total</h2>
          <h1 style={{ fontSize: '3rem', margin: '0.5rem 0', color: 'var(--accent-color)' }}>${formatNum(totalUSD)}</h1>
          <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>≈ Bs. {formatNum(totalBS)}</span>
        </div>
        <div className="glass-panel" style={{ textAlign: 'center', borderColor: 'var(--color-cloud)', padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-secondary)' }}>Tasa BCV</h3>
          <h2 style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>{loadingRates ? 'Cargando...' : `Bs. ${formatNum(rates.bcv)}`}</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-cloud)' }}>Oficial</span>
        </div>
        <div className="glass-panel" style={{ textAlign: 'center', borderColor: 'var(--color-security)', padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-secondary)' }}>Binance P2P</h3>
          <h2 style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>{loadingRates ? 'Cargando...' : `Bs. ${formatNum(rates.binance)}`}</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-security)' }}>Promedio</span>
        </div>
      </div>

      {/* CONTROL DE PRESUPUESTOS */}
      <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2>Presupuesto Mensual por Categorías</h2>
          <button 
            onClick={() => { setTempLimits(limits); setShowLimitsModal(true); }}
            style={{ background: '#000', color: 'white', border: '3px solid #000', padding: '0.5rem 1rem', borderRadius: '0', cursor: 'pointer', transition: 'transform 0.15s', boxShadow: '2px 2px 0 #000' }}
            onMouseOver={(e) => { e.target.style.transform = 'translate(1px, 1px)'; e.target.style.boxShadow = '1px 1px 0 #000'; }}
            onMouseOut={(e) => { e.target.style.transform = 'none'; e.target.style.boxShadow = '2px 2px 0 #000'; }}
          >
            ⚙️ Ajustar Límites
          </button>
        </div>
        <div style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Ingresos: <strong style={{ color: '#10b981' }}>${formatNum(income)}</strong> · Gastos:{' '}
          <strong style={{ color: '#ef4444' }}>${formatNum(expenses)}</strong> · Balance:{' '}
          <strong style={{ color: income - expenses >= 0 ? '#10b981' : '#ef4444' }}>${formatNum(income - expenses)}</strong>
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
                    ${formatNum(spent)} / ${formatNum(limit)}
                  </span>
                </div>
                <div style={{ height: '14px', background: '#ddd', borderRadius: '0', overflow: 'hidden', border: '2px solid #000' }}>
                  <div style={{
                    width: `${Math.min(100, ratio * 100)}%`, height: '100%',
                    background: over ? '#ef4444' : cat.color, transition: 'width 0.6s ease',
                    borderRight: '2px solid #000'
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CUENTAS Y WALLETS */}
      <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2>{editingId ? 'Editar cuenta' : 'Mis Cuentas y Wallets'}</h2>
          <button 
            onClick={() => setIsAccountsExpanded(!isAccountsExpanded)}
            style={{ background: 'var(--brutal-blue)', color: '#000', border: '3px solid #000', padding: '0.5rem 1rem', borderRadius: '0', fontWeight: '900', boxShadow: '2px 2px 0 #000', cursor: 'pointer', transition: 'transform 0.15s' }}
            onMouseOver={(e) => { e.target.style.transform = 'translate(1px, 1px)'; e.target.style.boxShadow = '1px 1px 0 #000'; }}
            onMouseOut={(e) => { e.target.style.transform = 'none'; e.target.style.boxShadow = '2px 2px 0 #000'; }}
          >
            {isAccountsExpanded ? '▲ Contraer' : '▼ Expandir cuentas'}
          </button>
        </div>

        {isAccountsExpanded && (
          <>
            <form onSubmit={handleSaveAccount} style={{ display: 'flex', gap: '1rem', marginTop: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <input type="text" placeholder="Nombre (ej. Mercantil, Binance)" value={accName} onChange={(e) => setAccName(e.target.value)} required style={{ ...inputStyle, flex: 2, minWidth: '160px' }} />
              <input type="text" placeholder="Nro de cuenta (opcional)" value={accNumber} onChange={(e) => setAccNumber(e.target.value)} style={{ ...inputStyle, flex: 2, minWidth: '200px' }} />
              <select value={accCurrency} onChange={(e) => setAccCurrency(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                <option value="BS">Bolívares (BS)</option>
                <option value="USD">Dólares (USD/USDT)</option>
                <option value="PEN">Soles (PEN)</option>
              </select>
              <input type="number" step="0.01" placeholder="Saldo Actual" value={accBalance} onChange={(e) => setAccBalance(e.target.value)} required style={{ ...inputStyle, flex: 1, minWidth: '120px' }} />
              <button type="submit" style={{ background: 'var(--brutal-yellow)', color: '#000', border: '3px solid #000', padding: '0.75rem 1.5rem', borderRadius: '0', fontWeight: '900', boxShadow: '4px 4px 0 #000', cursor: 'pointer' }}>
                {editingId ? 'Guardar cambios' : '+ Añadir'}
              </button>
              {editingId && (
                <button type="button" onClick={cancelEdit} style={{ background: '#fff', color: '#000', border: '3px solid #000', padding: '0.75rem 1rem', borderRadius: '0', fontWeight: '900', boxShadow: '4px 4px 0 #000', cursor: 'pointer' }}>
                  Cancelar
                </button>
              )}
            </form>

            <div className="grid">
              {sortedAccounts.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Aún no tienes cuentas registradas.</p>}
              {sortedAccounts.map((acc) => (
                <div key={acc.id} style={{ padding: '1rem', background: '#fff', borderRadius: '0', border: '3px solid #000', borderLeft: `8px solid ${acc.currency === 'USD' ? 'var(--color-security)' : 'var(--color-cloud)'}`, position: 'relative', boxShadow: '4px 4px 0 #000' }}>
                  <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => startEdit(acc)} title="Editar" style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>✏️</button>
                    <button onClick={() => handleDeleteAccount(acc.id)} title="Eliminar" style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>🗑</button>
                  </div>
                  <div style={{ color: '#000', fontSize: '0.95rem', marginBottom: '0.2rem', fontWeight: '900' }}>{acc.name}</div>
                  {acc.accountNumber && <div style={{ fontSize: '0.8rem', color: '#000', marginBottom: '0.5rem', background: '#eee', padding: '0.2rem', display: 'inline-block', border: '1px solid #000', fontWeight: '600' }}>{acc.accountNumber}</div>}
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{acc.currency === 'USD' ? '$' : acc.currency === 'PEN' ? 'S/' : 'Bs. '}{formatNum(acc.balance)}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    ≈ {acc.currency === 'USD' ? `Bs. ${formatNum(acc.balance * rates.binance)}` : acc.currency === 'PEN' ? `Bs. ${formatNum((acc.balance / 3.75) * rates.binance)}` : `$${rates.binance ? formatNum(acc.balance / rates.binance) : 0}`}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* TRANSACCIONES */}
      <div className="grid">
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2>Registrar Transacción</h2>
          <form onSubmit={handleAddTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <label style={{ cursor: 'pointer', background: 'var(--brutal-blue)', border: '3px solid #000', padding: '0.75rem', borderRadius: '0', fontSize: '0.9rem', color: '#000', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '2px 2px 0 #000' }}>
                {isProcessingReceipt ? '⏳ Analizando...' : '📷 Escanear Comprobante (IA)'}
                <input type="file" accept="image/*" multiple onChange={handleFileUpload} style={{ display: 'none' }} disabled={isProcessingReceipt} />
              </label>
              {receiptUrls.length > 0 && !isProcessingReceipt && (
                <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  ✅ {receiptUrls.length} archivo(s) listo(s)
                </span>
              )}
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
              <select value={txCurrency} onChange={(e) => {
                setTxCurrency(e.target.value);
                if (e.target.value === 'VES' && !txRate) {
                  setTxRate(rates.bcv || '');
                }
              }} style={inputStyle}>
                <option value="USD">USD ($)</option>
                <option value="VES">VES (Bs.)</option>
              </select>
              <input type="number" step="0.01" placeholder={`Monto (${txCurrency})`} value={amount} onChange={(e) => setAmount(e.target.value)} required style={{ ...inputStyle, flex: 1, minWidth: '100px' }} />
            </div>

            {txCurrency === 'VES' && (
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '0.25rem' }}>Tasa de Cambio (Bs./$)</label>
                  <input type="number" step="0.01" placeholder="Tasa" value={txRate} onChange={(e) => setTxRate(e.target.value)} required style={{ ...inputStyle, width: '100%' }} />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '0.25rem' }}>Asociar a Cuenta/Wallet</label>
                <select value={txAccountId} onChange={(e) => setTxAccountId(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
                  <option value="">Ninguna (Efectivo/Otro)</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency} - Bal: {formatNum(acc.balance)})</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '0.25rem' }}>Fecha y Hora (Opcional)</label>
                <input type="datetime-local" value={txCreatedAt} onChange={(e) => setTxCreatedAt(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
              </div>
            </div>

            <input type="text" placeholder="Descripción (ej. Café, Transporte)" value={desc} onChange={(e) => setDesc(e.target.value)} required style={{ ...inputStyle, width: '100%' }} />
            <button type="submit" style={{ background: type === 'expense' ? 'var(--brutal-pink)' : 'var(--brutal-green)', color: '#000', border: '3px solid #000', padding: '0.75rem', borderRadius: '0', fontWeight: '900', boxShadow: '4px 4px 0 #000', cursor: 'pointer' }}>
              Guardar
            </button>
          </form>
        </div>

        <div className="glass-panel" style={{ maxHeight: '400px', overflowY: 'auto', padding: '1.5rem' }}>
          <h2>Historial Reciente</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            {transactions.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No hay transacciones aún.</p>}
            {transactions.map((t) => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: '#fff', borderRadius: '0', border: '3px solid #000', borderLeft: `8px solid ${t.type === 'expense' ? '#ef4444' : '#10b981'}`, boxShadow: '2px 2px 0 #000' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', color: '#000' }}>
                    {t.description}
                    {t.type === 'expense' && t.category && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginLeft: '0.5rem', fontWeight: 'normal' }}>
                        · {FINANCE_CATEGORIES.find(c => c.id === t.category)?.label || t.category}
                      </span>
                    )}
                    {t.telegramFileIds && t.telegramFileIds.length > 0 ? (
                      t.telegramFileIds.map((fid, idx) => (
                        <a key={idx} href={`/api/telegram-image?id=${fid}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', marginLeft: '0.5rem', color: 'var(--accent-color)', textDecoration: 'none' }}>
                          📷 Doc {idx + 1}
                        </a>
                      ))
                    ) : t.telegramFileId ? (
                      <a href={`/api/telegram-image?id=${t.telegramFileId}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', marginLeft: '0.5rem', color: 'var(--accent-color)', textDecoration: 'none' }}>
                        📷 Ver
                      </a>
                    ) : null}
                  </div>
                  
                  {t.accountName && (
                    <div style={{ fontSize: '0.7rem', color: '#555', marginTop: '0.2rem', fontWeight: 600 }}>
                      💳 {t.accountName}: {t.currency === 'USD' ? '$' : 'Bs.'}{formatNum(t.balanceBefore)} ➔ {t.currency === 'USD' ? '$' : 'Bs.'}{formatNum(t.balanceAfter)}
                    </div>
                  )}

                  <div style={{ fontSize: '0.65rem', color: '#888', marginTop: '0.15rem' }}>
                    📅 {new Date(t.createdAt).toLocaleString('es-VE', { timeZone: 'America/Caracas', dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 'bold', color: t.type === 'expense' ? '#ef4444' : '#10b981' }}>
                    {t.type === 'expense' ? '-' : '+'}{t.currency === 'VES' ? 'Bs. ' : '$'}{formatNum(t.amount)}
                  </span>
                  <button onClick={() => handleDeleteTransaction(t.id)} title="Eliminar" style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL DE LÍMITES */}
      {showLimitsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
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
