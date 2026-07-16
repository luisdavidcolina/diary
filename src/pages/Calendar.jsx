import React, { useEffect, useMemo, useState } from 'react';
import { SUBJECTS, ITEMS } from '../data/syllabus';
import { projectSchedule } from '../services/planner';
import { getConfig, getDoneMap } from '../services/store';
import { getLifestyleItems } from '../services/db';

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const todayKey = iso(new Date());

const Calendar = () => {
  const [cursor, setCursor] = useState(() => new Date());
  const [reminders, setReminders] = useState([]);
  const [selected, setSelected] = useState(todayKey);

  const doneMap = useMemo(() => getDoneMap(), []);
  const config = useMemo(() => getConfig(), []);
  const study = useMemo(() => projectSchedule(ITEMS, doneMap, config), [doneMap, config]);

  useEffect(() => {
    getLifestyleItems().then(setReminders).catch(console.error);
  }, []);

  // Recordatorios/tareas con fecha → mapa por día.
  const remindersByDate = useMemo(() => {
    const m = {};
    reminders.forEach((r) => {
      if (r.reminderDate) (m[r.reminderDate] = m[r.reminderDate] || []).push(r);
    });
    return m;
  }, [reminders]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Celdas: huecos iniciales + días del mes.
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const move = (delta) => setCursor(new Date(year, month + delta, 1));

  const selStudy = study[selected] || [];
  const selReminders = remindersByDate[selected] || [];

  return (
    <div style={{ animation: 'fadeInUp 0.6s ease' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 className="text-gradient">Calendario</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Tu plan de estudio, pendientes y recordatorios en un solo lugar.</p>
      </header>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        {/* Navegación de mes */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button className="ghost-btn" onClick={() => move(-1)}>←</button>
          <h2 style={{ margin: 0 }}>{MONTHS[month]} {year}</h2>
          <button className="ghost-btn" onClick={() => move(1)}>→</button>
        </div>

        {/* Cabecera de días */}
        <div className="cal-grid" style={{ marginBottom: '0.4rem' }}>
          {WEEKDAYS.map((w) => (
            <div key={w} style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{w}</div>
          ))}
        </div>

        {/* Celdas */}
        <div className="cal-grid">
          {cells.map((date, i) => {
            if (!date) return <div key={`b${i}`} />;
            const key = iso(date);
            const st = study[key] || [];
            const rem = remindersByDate[key] || [];
            const isToday = key === todayKey;
            const isSel = key === selected;
            // Colores únicos de materias presentes ese día.
            const subjColors = [...new Set(st.map((it) => SUBJECTS[it.subject].color))];
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={`cal-cell ${isSel ? 'is-sel' : ''} ${isToday ? 'is-today' : ''}`}
              >
                <span className="cal-day">{date.getDate()}</span>
                <span className="cal-marks">
                  {subjColors.map((c, idx) => (
                    <span key={idx} className="cal-dot" style={{ background: c }} />
                  ))}
                  {rem.length > 0 && <span className="cal-bell">🔔{rem.length > 1 ? rem.length : ''}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detalle del día seleccionado */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
        <h2 style={{ marginTop: 0 }}>
          {selected === todayKey ? 'Hoy' : new Date(`${selected}T00:00:00`).toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' })}
        </h2>

        <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📚 Plan de estudio</h3>
        {selStudy.length === 0 ? (
          <p className="muted" style={{ marginBottom: '1.25rem' }}>Sin temas asignados este día.</p>
        ) : (
          <ul className="checklist" style={{ marginBottom: '1.25rem' }}>
            {selStudy.map((it) => {
              const s = SUBJECTS[it.subject];
              return (
                <li key={it.id} className="checklist-row">
                  <div className="checklist-item" style={{ padding: '0.4rem 0.5rem' }}>
                    <span className="subject-dot" style={{ background: s.color }} />
                    <span className="checklist-unit">{it.unit}</span>
                    <span>{it.title}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🔔 Pendientes y recordatorios</h3>
        {selReminders.length === 0 ? (
          <p className="muted">Nada agendado para este día.</p>
        ) : (
          <ul className="mini-list">
            {selReminders.map((r) => (
              <li key={r.id} className={r.isCompleted ? 'is-done' : ''}>
                <span style={r.isCompleted ? { textDecoration: 'line-through', color: 'var(--text-secondary)' } : undefined}>
                  {r.reminderTime ? `${r.reminderTime} · ` : ''}{r.title}
                </span>
                {r.isCompleted && <span>✓</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Calendar;
