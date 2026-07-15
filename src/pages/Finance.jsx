import React, { useState, useEffect } from 'react';
import { addTransaction, getTransactions } from '../services/db';

const Finance = () => {
  const [rates, setRates] = useState({ bcv: 0, binance: 0 });
  const [loadingRates, setLoadingRates] = useState(true);
  
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState('expense');

  useEffect(() => {
    fetchRates();
    loadTransactions();
  }, []);

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

  return (
    <div style={{ animation: 'fadeInUp 0.6s ease' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="text-gradient">Finanzas Personales</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Controla tu presupuesto y sigue las tasas del día.</p>
      </header>

      {/* Tasas de Cambio */}
      <div className="grid" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ textAlign: 'center', borderColor: 'var(--color-cloud)' }}>
          <h3 style={{ color: 'var(--text-secondary)' }}>Tasa BCV</h3>
          <h2 style={{ fontSize: '2rem', margin: '0.5rem 0' }}>
            {loadingRates ? 'Cargando...' : `Bs. ${rates.bcv.toFixed(2)}`}
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-cloud)' }}>Oficial</span>
        </div>
        <div className="glass-panel" style={{ textAlign: 'center', borderColor: 'var(--color-security)' }}>
          <h3 style={{ color: 'var(--text-secondary)' }}>Binance P2P (Promedio)</h3>
          <h2 style={{ fontSize: '2rem', margin: '0.5rem 0' }}>
            {loadingRates ? 'Cargando...' : `Bs. ${rates.binance.toFixed(2)}`}
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-security)' }}>Mercado Libre</span>
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
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', borderLeft: `4px solid ${t.type === 'expense' ? '#ef4444' : '#10b981'}` }}>
                <span>{t.description}</span>
                <span style={{ fontWeight: 'bold', color: t.type === 'expense' ? '#ef4444' : '#10b981' }}>
                  {t.type === 'expense' ? '-' : '+'}${parseFloat(t.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Finance;
