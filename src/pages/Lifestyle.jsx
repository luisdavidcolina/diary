import React, { useState, useEffect } from 'react';
import { addHabitOrTask, getLifestyleItems } from '../services/db';

const Lifestyle = () => {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('task');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const data = await getLifestyleItems();
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await addHabitOrTask(title, category);
      setTitle('');
      loadItems();
    } catch (e) {
      console.error(e);
    }
  };

  const tasks = items.filter(i => i.category === 'task');
  const habits = items.filter(i => i.category === 'habit');

  return (
    <div style={{ animation: 'fadeInUp 0.6s ease' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="text-gradient">Hábitos y Organización</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Tu segundo cerebro personal.</p>
      </header>

      {/* Captura Rápida (Inbox) */}
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <h2>Captura Rápida (Inbox)</h2>
        <form onSubmit={handleAddItem} style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white' }}
          >
            <option value="task">Pendiente Único</option>
            <option value="habit">Hábito Diario</option>
          </select>
          <input 
            type="text" 
            placeholder="¿Qué tienes en mente?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white' }}
          />
          <button type="submit" style={{ background: 'var(--accent-color)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            Guardar
          </button>
        </form>
      </div>

      <div className="grid">
        {/* Hábitos Diarios */}
        <div className="glass-panel">
          <h2 style={{ color: 'var(--color-cloud)' }}>Rutinas y Hábitos</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            {habits.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No hay hábitos registrados.</p>}
            {habits.map(h => (
              <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', borderLeft: `4px solid var(--color-cloud)` }}>
                <input type="checkbox" style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                <span style={{ fontSize: '1.1rem' }}>{h.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tareas (Pendientes) */}
        <div className="glass-panel">
          <h2 style={{ color: 'var(--color-english)' }}>Pendientes (To-Dos)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            {tasks.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Inbox limpio. ¡Buen trabajo!</p>}
            {tasks.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', borderLeft: `4px solid var(--color-english)` }}>
                <input type="checkbox" style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                <span style={{ fontSize: '1.1rem' }}>{t.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lifestyle;
