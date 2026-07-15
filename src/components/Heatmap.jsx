import React from 'react';

const isoOf = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Heatmap estilo GitHub. `counts` = { 'YYYY-MM-DD': n }.
const Heatmap = ({ counts = {}, weeks = 13, color = 'var(--color-cloud)' }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Inicio: `weeks` semanas atrás, alineado al domingo.
  const start = new Date(today);
  start.setDate(start.getDate() - (weeks * 7 - 1));
  start.setDate(start.getDate() - start.getDay());

  const cols = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      if (cursor <= today) {
        const key = isoOf(cursor);
        week.push({ key, count: counts[key] || 0 });
      } else {
        week.push(null);
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    cols.push(week);
  }

  const max = Math.max(1, ...Object.values(counts));
  const cellColor = (count) => {
    if (!count) return 'rgba(255,255,255,0.06)';
    const level = Math.min(1, 0.25 + (count / max) * 0.75);
    return `color-mix(in srgb, ${color} ${Math.round(level * 100)}%, transparent)`;
  };

  return (
    <div style={{ display: 'flex', gap: '3px', overflowX: 'auto', paddingBottom: '0.25rem' }}>
      {cols.map((week, wi) => (
        <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {week.map((cell, di) =>
            cell ? (
              <div
                key={cell.key}
                title={`${cell.key}: ${cell.count} completado(s)`}
                style={{ width: '13px', height: '13px', borderRadius: '3px', background: cellColor(cell.count) }}
              />
            ) : (
              <div key={di} style={{ width: '13px', height: '13px' }} />
            )
          )}
        </div>
      ))}
    </div>
  );
};

export default Heatmap;
