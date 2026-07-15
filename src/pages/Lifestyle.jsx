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
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [dbError, setDbError] = useState(null);

  useEffect(() => {
    loadItems();
    loadLogs();
  }, []);

  const loadItems = async () => {
    try {
      setDbError(null);
      const data = await getLifestyleItems();
      setItems(data);
    } catch (e) {
      console.error(e);
      setDbError(e.message || "Error al conectar con la base de datos.");
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

  const scheduleExactReminder = async (id, title, date, time) => {
    const res = await fetch('/api/schedule-exact-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, title, date, time })
    });
    
    // Si la respuesta no es json o falla, fallamos duro
    let data;
    try {
      data = await res.json();
    } catch(e) {
      throw new Error(`Error del servidor HTTP ${res.status}`);
    }

    if (!data.success) {
      throw new Error(JSON.stringify(data.error) || 'Fallo en la API de QStash/Vercel');
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    setIsSaving(true);
    setErrorMsg(null);
    
    try {
      const dateVal = category === 'task' ? reminderDate : null;
      const timeVal = category === 'task' ? reminderTime : null;
      
      const newId = await addHabitOrTask(title, category, dateVal, timeVal);
      
      if (dateVal && timeVal) {
        await scheduleExactReminder(newId, title, dateVal, timeVal);
      }
      
      setTitle('');
      setReminderDate('');
      setReminderTime('');
      loadItems();
    } catch (e) {
      console.error(e);
      setErrorMsg(e.message || "Error desconocido al guardar");
    } finally {
      setIsSaving(false);
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
  
  const genericTasks = tasks.filter((t) => !t.reminderDate && !t.reminderTime);
  const reminders = tasks.filter((t) => t.reminderDate || t.reminderTime);
  
  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('taskId', id);
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  
  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('taskId');
    if (id) {
      const item = items.find(i => i.id === id);
      if (item && Boolean(item.isCompleted) !== targetStatus) {
        await handleToggle(item);
      }
    }
  };

  const renderCard = (it) => (
    <div 
      key={it.id}
      draggable
      onDragStart={(e) => {
        handleDragStart(e, it.id);
        e.currentTarget.style.opacity = '0.5';
      }}
      onDragEnd={(e) => e.currentTarget.style.opacity = it.isCompleted ? '0.6' : '1'}
      style={{
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px',
        padding: '1rem',
        cursor: 'grab',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        transition: 'transform 0.2s',
        opacity: it.isCompleted ? 0.6 : 1
      }}
      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h4 style={{ margin: 0, fontSize: '1.05rem', textDecoration: it.isCompleted ? 'line-through' : 'none', color: it.isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{it.title}</h4>
        <button
          onClick={() => handleDelete(it.id)}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.2rem', fontSize: '1.1rem' }}
          title="Eliminar"
        >
          🗑
        </button>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {it.reminderDate && (
          <span style={{ fontSize: '0.75rem', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', padding: '0.25rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
            🗓️ {it.reminderDate}
          </span>
        )}
        {it.reminderTime && (
          <span style={{ fontSize: '0.75rem', background: 'rgba(234, 179, 8, 0.15)', color: '#fde047', padding: '0.25rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
            ⏰ {it.reminderTime}
          </span>
        )}
      </div>
    </div>
  );

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
        {it.reminderDate && (
          <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            🔔 {it.reminderDate} {it.reminderTime ? `a las ${it.reminderTime}` : ''}
          </span>
        )}
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
      <div className="glass-panel" style={{ marginBottom: '2rem', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '300px', height: '300px', background: 'var(--accent-glow)', filter: 'blur(100px)', borderRadius: '50%', opacity: 0.5, pointerEvents: 'none' }}></div>
        
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--accent-color)' }}>⚡</span> Captura Rápida
        </h2>
        
        <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative', zIndex: 1 }}>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: '0 0 auto', background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '0.25rem', border: '1px solid var(--glass-border)' }}>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ padding: '0.6rem 1rem', borderRadius: '8px', background: 'transparent', border: 'none', color: 'white', outline: 'none', cursor: 'pointer', fontWeight: '600' }}
              >
                <option value="task" style={{ background: 'var(--bg-color)' }}>📌 Pendiente</option>
                <option value="habit" style={{ background: 'var(--bg-color)' }}>🔄 Hábito</option>
              </select>
            </div>
            
            <input
              type="text"
              placeholder="¿Qué quieres recordar u organizar?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ flex: 1, minWidth: '250px', padding: '0.85rem 1.25rem', borderRadius: '12px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent-color)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
            />
          </div>

          {category === 'task' && (
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px dashed var(--glass-border)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1, minWidth: '150px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🗓️ Fecha (Opcional)</label>
                <input
                  type="date"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                  style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', outline: 'none', colorScheme: 'dark' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1, minWidth: '150px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>⏰ Hora (Opcional)</label>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', outline: 'none', colorScheme: 'dark' }}
                />
              </div>
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {errorMsg && (
              <span style={{ color: '#ef4444', fontSize: '0.85rem', maxWidth: '300px' }}>⚠️ {errorMsg}</span>
            )}
            <button 
              type="submit" 
              disabled={isSaving}
              style={{ 
                background: 'linear-gradient(135deg, var(--accent-color) 0%, #a5b4fc 100%)', 
                color: 'white', border: 'none', padding: '0.85rem 2rem', borderRadius: '12px', 
                fontWeight: 'bold', cursor: isSaving ? 'not-allowed' : 'pointer', 
                boxShadow: '0 4px 15px var(--accent-glow)', transition: 'transform 0.2s, box-shadow 0.2s',
                opacity: isSaving ? 0.7 : 1,
                marginLeft: 'auto'
              }}
              onMouseOver={(e) => { if(!isSaving) { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 20px var(--accent-glow)'; } }}
              onMouseOut={(e) => { if(!isSaving) { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 15px var(--accent-glow)'; } }}
            >
              {isSaving ? 'Guardando...' : 'Guardar Tarea'}
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Cargando…</p>
      ) : dbError ? (
        <div style={{ padding: '2rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', color: '#fca5a5' }}>
           <h3>Error de Conexión</h3>
           <p style={{ marginTop: '0.5rem' }}>{dbError}</p>
           <p style={{ fontSize: '0.85rem', marginTop: '1rem', color: '#f87171' }}>Sugerencia: Si usas Brave u otro bloqueador de anuncios, intenta desactivar los escudos para esta página, ya que pueden bloquear la base de datos.</p>
        </div>
      ) : (
        <>
          <div className="grid">
            {/* Hábitos Diarios */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h2 style={{ color: 'var(--color-cloud)' }}>Rutinas y Hábitos</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                {habits.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No hay hábitos registrados.</p>}
                {habits.map((h) => renderItem(h, 'var(--color-cloud)'))}
              </div>
            </div>

            {/* Tareas (Pendientes Genéricos) */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h2 style={{ color: 'var(--color-english)' }}>Pendientes</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                {genericTasks.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No hay tareas pendientes.</p>}
                {genericTasks.map((t) => renderItem(t, 'var(--color-english)'))}
              </div>
            </div>
          </div>

          {/* Tablero Kanban para Recordatorios Programados */}
        {reminders.length > 0 && (
          <div style={{ marginTop: '3rem', animation: 'fadeInUp 0.8s ease' }}>
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--color-security)' }}>📌</span> Tablero de Recordatorios
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              
              {/* Columna Por Hacer */}
              <div 
                className="glass-panel" 
                style={{ padding: '1.5rem', minHeight: '300px', background: 'rgba(255,255,255,0.02)' }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, false)}
              >
                <h3 style={{ marginBottom: '1.25rem', color: 'var(--color-security)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Por Hacer
                  <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.6rem', borderRadius: '12px', color: 'white' }}>
                    {reminders.filter(r => !r.isCompleted).length}
                  </span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {reminders.filter(r => !r.isCompleted).map(renderCard)}
                  {reminders.filter(r => !r.isCompleted).length === 0 && (
                     <div style={{ border: '1px dashed var(--glass-border)', padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', borderRadius: '12px' }}>Arrastra tarjetas aquí</div>
                  )}
                </div>
              </div>

              {/* Columna Completados */}
              <div 
                className="glass-panel" 
                style={{ padding: '1.5rem', minHeight: '300px', background: 'rgba(255,255,255,0.02)' }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, true)}
              >
                <h3 style={{ marginBottom: '1.25rem', color: 'var(--color-cloud)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Completados
                  <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.6rem', borderRadius: '12px', color: 'white' }}>
                    {reminders.filter(r => r.isCompleted).length}
                  </span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {reminders.filter(r => r.isCompleted).map(renderCard)}
                  {reminders.filter(r => r.isCompleted).length === 0 && (
                     <div style={{ border: '1px dashed var(--glass-border)', padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', borderRadius: '12px' }}>Arrastra tarjetas aquí</div>
                  )}
                </div>
              </div>
              
            </div>
          </div>
        )}
        </>
      )}
    </div>
  );
};

export default Lifestyle;
