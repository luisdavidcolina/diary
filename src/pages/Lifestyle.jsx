import React, { useState, useEffect } from 'react';
import {
  addHabitOrTask, getLifestyleItems, setLifestyleCompleted, deleteLifestyleItem,
  logHabitCompletion, getHabitLogs
} from '../services/db';
import Heatmap from '../components/Heatmap';

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Racha: días consecutivos (terminando hoy o ayer) con al menos un completado.
const computeStreak = (daysSet) => {
  const has = (d) => daysSet.has(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!has(cursor)) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (has(cursor)) { streak += 1; cursor.setDate(cursor.getDate() - 1); }
  return streak;
};

const Lifestyle = () => {
  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('task');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
    loadLogs();
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

  const loadLogs = async () => {
    try {
      setLogs(await getHabitLogs());
    } catch (e) {
      console.error(e);
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

  const handleToggle = async (item) => {
    const nowCompleted = !item.isCompleted;
    // Optimista: refleja el cambio de inmediato y persiste en segundo plano.
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isCompleted: nowCompleted } : i)));
    if (nowCompleted) {
      // Registro optimista para el heatmap/racha.
      setLogs((prev) => [{ id: `tmp-${Date.now()}`, date: todayISO() }, ...prev]);
    }
    try {
      await setLifestyleCompleted(item.id, nowCompleted);
      if (nowCompleted) {
        await logHabitCompletion(todayISO());
        loadLogs();
      }
    } catch (e) {
      console.error(e);
      loadItems();
      loadLogs();
    }
  };

  const handleDelete = async (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await deleteLifestyleItem(id);
    } catch (e) {
      console.error(e);
      loadItems();
    }
  };

  const tasks = items.filter((i) => i.category === 'task');
  const habits = items.filter((i) => i.category === 'habit');

  // Datos del heatmap: conteo de completados por día + racha.
  const counts = logs.reduce((acc, l) => {
    if (l.date) acc[l.date] = (acc[l.date] || 0) + 1;
    return acc;
  }, {});
  const streak = computeStreak(new Set(Object.keys(counts)));

  const renderItem = (it, color) => (
    <div
      key={it.id}
      style={{
        display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
        background: 'rgba(255,255,255,0.05)', borderRadius: '8px', borderLeft: `4px solid ${color}`,
        opacity: it.isCompleted ? 0.55 : 1
      }}
    >
      <input
        type="checkbox"
        checked={Boolean(it.isCompleted)}
        onChange={() => handleToggle(it)}
        style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: color }}
      />
      <span style={{ fontSize: '1.1rem', flex: 1, textDecoration: it.isCompleted ? 'line-through' : 'none' }}>
        {it.title}
      </span>
      <button
        onClick={() => handleDelete(it.id)}
        title="Eliminar"
        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem' }}
      >
        🗑
      </button>
    </div>
  );

  return (
    <div style={{ animation: 'fadeInUp 0.6s ease' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="text-gradient">Hábitos y Organización</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Tu segundo cerebro personal.</p>
      </header>

      {/* Heatmap de actividad + racha */}
      <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2>Actividad</h2>
          {streak > 0 && (
            <span className="streak-badge">🔥 {streak} {streak === 1 ? 'día' : 'días'} de racha</span>
          )}
        </div>
        <Heatmap counts={counts} color="var(--color-cloud)" />
      </div>

      {/* Captura Rápida (Inbox) */}
      <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <h2>Captura Rápida (Inbox)</h2>
        <form onSubmit={handleAddItem} style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
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
            style={{ flex: 1, minWidth: '180px', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white' }}
          />
          <button type="submit" style={{ background: 'var(--accent-color)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            Guardar
          </button>
        </form>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Cargando…</p>
      ) : (
        <div className="grid">
          {/* Hábitos Diarios */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h2 style={{ color: 'var(--color-cloud)' }}>Rutinas y Hábitos</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              {habits.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No hay hábitos registrados.</p>}
              {habits.map((h) => renderItem(h, 'var(--color-cloud)'))}
            </div>
          </div>

          {/* Tareas (Pendientes) */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h2 style={{ color: 'var(--color-english)' }}>Pendientes (To-Dos)</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              {tasks.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Inbox limpio. ¡Buen trabajo!</p>}
              {tasks.map((t) => renderItem(t, 'var(--color-english)'))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lifestyle;
