import React from 'react';
import SyllabusChecklist from './SyllabusChecklist';

// Panel "Plan de Hoy": la meta diaria autoajustada + los items de hoy.
const TodayPlan = ({ plan, doneMap, onToggle, onOpen }) => {
  const { perDay, daysLeft, remaining, doneToday, todayItems, finished } = plan;

  if (finished) {
    return (
      <section className="glass-panel today-panel">
        <h2>🎉 Plan completo</h2>
        <p className="muted">Terminaste todo el temario. Ajusta la fecha objetivo o agrega material nuevo.</p>
      </section>
    );
  }

  const progressToday = Math.min(100, Math.round((doneToday / Math.max(perDay, 1)) * 100));

  return (
    <section className="glass-panel today-panel">
      <div className="today-head">
        <div>
          <h2>Plan de Hoy</h2>
          <p className="muted">
            Meta: <strong>{perDay}</strong> {perDay === 1 ? 'tarea' : 'tareas'} · hechas hoy:{' '}
            <strong>{doneToday}</strong>/{perDay}
          </p>
        </div>
        <div className="today-metrics">
          <span className="metric"><strong>{remaining}</strong> pendientes</span>
          <span className="metric"><strong>{daysLeft}</strong> días</span>
        </div>
      </div>

      <div className="progress-bar-bg" style={{ marginBottom: '1rem' }}>
        <div
          className="progress-bar-fill"
          style={{ width: `${progressToday}%`, backgroundColor: 'var(--accent-color)', boxShadow: '0 0 10px var(--accent-glow)' }}
        />
      </div>

      <SyllabusChecklist
        items={todayItems}
        doneMap={doneMap}
        onToggle={onToggle}
        onOpen={onOpen}
        showSubject
        emptyLabel="Sin tareas para hoy."
      />
    </section>
  );
};

export default TodayPlan;
