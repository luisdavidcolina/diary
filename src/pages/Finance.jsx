import React, { useState, useEffect } from 'react';
import { addTransaction, getTransactions, addOrUpdateAccount, getAccounts, deleteTransaction, deleteAccount } from '../services/db';

const Finance = () => {
  const [rates, setRates] = useState({ bcv: 0, binance: 0 });
  const [loadingRates, setLoadingRates] = useState(true);
  
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  
  // Estados para Gastos
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState('expense');

  // Estados para Cuentas
  const [accName, setAccName] = useState('');
  const [accCurrency, setAccCurrency] = useState('BS');
  const [accBalance, setAccBalance] = useState('');

  useEffect(() => {
    fetchRates();
    loadTransactions();
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await getAccounts();
      setAccounts(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRates = async () => {
    try {
      // Intentar cargar del caché primero (válido por 4 horas)
      const cached = localStorage.getItem('exchange_rates');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (new Date().getTime() - timestamp < 4 * 60 * 60 * 1000) {
          setRates(data);
          setLoadingRates(false);
          return;
        }
      }

      // Consumir API Pública de pydolarvenezuela
      const res = await fetch("https://pydolarvenezuela-api.vercel.app/api/v1/dollar");
      const json = await res.json();
      
      const newRates = {
        bcv: json.monitors?.bcv?.price || 0,
        binance: json.monitors?.binance?.price || 0
      };
      
      setRates(newRates);
      localStorage.setItem('exchange_rates', JSON.stringify({
        data: newRates,
        timestamp: new Date().getTime()
      }));
    } catch (error) {
      console.error("Error obteniendo tasas:", error);
    } finally {
      setLoadingRates(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!amount || !desc) return;
    try {
      await addTransaction(amount, desc, type);
      setAmount('');
      setDesc('');
      loadTransactions();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!accName || !accBalance) return;
    try {
      await addOrUpdateAccount(null, accName, accCurrency, accBalance);
      setAccName('');
      setAccBalance('');
      loadAccounts();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAccount = async (id) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    try {
      await deleteAccount(id);
    } catch (e) {
      console.error(e);
      loadAccounts();
    }
  };

  const handleDeleteTransaction = async (id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteTransaction(id);
    } catch (e) {
      console.error(e);
      loadTransactions();
    }
  };

  // --- CÁLCULOS DE PATRIMONIO NETO ---
  let totalUSD = 0;
  let totalBS = 0;

  accounts.forEach(acc => {
    if (acc.currency === 'USD') {
      totalUSD += acc.balance;
      if (rates.binance) totalBS += acc.balance * rates.binance;
    } else if (acc.currency === 'BS') {
      totalBS += acc.balance;
      if (rates.bcv) totalUSD += acc.balance / rates.bcv;
    }
  });

  return (
    <div style={{ animation: 'fadeInUp 0.6s ease' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="text-gradient">Finanzas Personales</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Controla tu presupuesto y sigue las tasas del día.</p>
      </header>

      {/* PATRIMONIO NETO Y TASAS */}
      <div className="grid" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ textAlign: 'center', borderColor: 'var(--accent-color)', gridColumn: '1 / -1' }}>
          <h2 style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1rem' }}>Patrimonio Neto Total</h2>
          <h1 style={{ fontSize: '3rem', margin: '0.5rem 0', color: 'var(--accent-color)' }}>
            ${totalUSD.toFixed(2)}
          </h1>
          <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>≈ Bs. {totalBS.toFixed(2)}</span>
        </div>

        <div className="glass-panel" style={{ textAlign: 'center', borderColor: 'var(--color-cloud)' }}>
          <h3 style={{ color: 'var(--text-secondary)' }}>Tasa BCV</h3>
          <h2 style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>
            {loadingRates ? 'Cargando...' : `Bs. ${rates.bcv.toFixed(2)}`}
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-cloud)' }}>Oficial</span>
        </div>
        
        <div className="glass-panel" style={{ textAlign: 'center', borderColor: 'var(--color-security)' }}>
          <h3 style={{ color: 'var(--text-secondary)' }}>Binance P2P</h3>
          <h2 style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>
            {loadingRates ? 'Cargando...' : `Bs. ${rates.binance.toFixed(2)}`}
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-security)' }}>Promedio</span>
        </div>
      </div>

      {/* CUENTAS Y WALLETS */}
      <div className="grid" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Mis Cuentas y Wallets</h2>
          </div>
          
          {/* Formulario Nueva Cuenta */}
          <form onSubmit={handleAddAccount} style={{ display: 'flex', gap: '1rem', marginTop: '1rem', marginBottom: '1.5rem' }}>
            <input 
              type="text" 
              placeholder="Nombre (ej. Mercantil, Binance)"
              value={accName}
              onChange={(e) => setAccName(e.target.value)}
              required
              style={{ flex: 2, padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white' }}
            />
            <select 
              value={accCurrency} 
              onChange={(e) => setAccCurrency(e.target.value)}
              style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white' }}
            >
              <option value="BS">Bolívares (BS)</option>
              <option value="USD">Dólares (USD/USDT)</option>
            </select>
            <input 
              type="number" 
              step="0.01"
              placeholder="Saldo Actual"
              value={accBalance}
              onChange={(e) => setAccBalance(e.target.value)}
              required
              style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white' }}
            />
            <button type="submit" style={{ background: 'var(--accent-color)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              + Añadir
            </button>
          </form>

          {/* Lista de Cuentas */}
          <div className="grid">
            {accounts.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>Aún no tienes cuentas registradas.</p> : null}
            {accounts.map(acc => (
              <div key={acc.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', borderLeft: `4px solid ${acc.currency === 'USD' ? 'var(--color-security)' : 'var(--color-cloud)'}`, position: 'relative' }}>
                <button
                  onClick={() => handleDeleteAccount(acc.id)}
                  title="Eliminar cuenta"
                  style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  🗑
                </button>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{acc.name}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {acc.currency === 'USD' ? '$' : 'Bs. '}{acc.balance.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  ≈ {acc.currency === 'USD'
                      ? `Bs. ${(acc.balance * rates.binance).toFixed(2)}`
                      : `$${rates.bcv ? (acc.balance / rates.bcv).toFixed(2) : 0}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid">
        {/* Formulario de Transacción */}
        <div className="glass-panel">
          <h2>Registrar Transacción</h2>
          <form onSubmit={handleAddTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value)}
                style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white' }}
              >
                <option value="expense">Gasto (-)</option>
                <option value="income">Ingreso (+)</option>
              </select>
              <input 
                type="number" 
                step="0.01"
                placeholder="Monto ($)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white' }}
              />
            </div>
            <input 
              type="text" 
              placeholder="Descripción (ej. Café, Transporte)"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              required
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white' }}
            />
            <button type="submit" style={{ background: type === 'expense' ? '#ef4444' : '#10b981', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              Guardar
            </button>
          </form>
        </div>

        {/* Lista de Transacciones */}
        <div className="glass-panel" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <h2>Historial Reciente</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            {transactions.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No hay transacciones aún.</p> : null}
            {transactions.map(t => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', borderLeft: `4px solid ${t.type === 'expense' ? '#ef4444' : '#10b981'}` }}>
                <span style={{ flex: 1 }}>{t.description}</span>
                <span style={{ fontWeight: 'bold', color: t.type === 'expense' ? '#ef4444' : '#10b981' }}>
                  {t.type === 'expense' ? '-' : '+'}${parseFloat(t.amount).toFixed(2)}
                </span>
                <button
                  onClick={() => handleDeleteTransaction(t.id)}
                  title="Eliminar"
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Finance;
