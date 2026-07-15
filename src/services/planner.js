// Motor de planificación adaptativa (funciones puras, sin estado ni I/O).
//
// Idea central: la carga diaria = ceil(pendientes / díasRestantes).
// Como se recalcula cada día con los pendientes y días reales, si un día no
// completas nada, mañana hay más pendientes y menos días → la meta diaria sube
// sola. No hace falta "reprogramar" a mano: el plan se autoajusta.

import { SUBJECT_ORDER } from '../data/syllabus';

export function todayISO() {
  const d = new Date();
  return isoDate(d);
}

function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Días (mínimo 1) desde `from` hasta `target`, ambos 'YYYY-MM-DD'.
export function daysUntil(target, from = todayISO()) {
  const a = new Date(`${from}T00:00:00`);
  const b = new Date(`${target}T00:00:00`);
  return Math.max(1, Math.round((b - a) / 86400000));
}

function completedOn(doneMap, itemId, dayISO) {
  const stamp = doneMap[itemId];
  return typeof stamp === 'string' && stamp.slice(0, 10) === dayISO;
}

// Backlog de pendientes intercalando materias (round-robin) para que cada día
// mezcle asignaturas en vez de agotar una sola.
export function orderedBacklog(items, doneMap) {
  const bySub = {};
  for (const s of SUBJECT_ORDER) bySub[s] = [];
  for (const it of items) {
    if (!doneMap[it.id]) {
      (bySub[it.subject] || (bySub[it.subject] = [])).push(it);
    }
  }
  const out = [];
  let i = 0;
  let added = true;
  while (added) {
    added = false;
    for (const s of SUBJECT_ORDER) {
      if (bySub[s][i]) {
        out.push(bySub[s][i]);
        added = true;
      }
    }
    i++;
  }
  return out;
}

// Plan del día de hoy.
// Devuelve la meta diaria, los items de hoy (pendientes + los ya hechos hoy),
// y métricas para el encabezado.
export function buildPlan(items, doneMap, config) {
  const today = todayISO();
  const daysLeft = daysUntil(config.targetDate);
  const backlog = orderedBacklog(items, doneMap);
  const remaining = backlog.length;

  const doneToday = items.filter((it) => completedOn(doneMap, it.id, today));

  // Base de trabajo "al comenzar hoy" = pendientes + lo ya hecho hoy.
  // Así la meta del día no cambia a medida que marcas cosas.
  const baseWork = remaining + doneToday.length;
  const auto = Math.max(1, Math.ceil(baseWork / daysLeft));
  const perDay =
    config.perDayOverride && config.perDayOverride > 0
      ? config.perDayOverride
      : auto;

  const pendingToday = backlog.slice(0, Math.max(0, perDay - doneToday.length));

  // Items de hoy: primero los pendientes por hacer, luego los ya completados hoy.
  const todayItems = [...pendingToday, ...doneToday];

  const totalItems = items.length;
  const doneTotal = totalItems - remaining;

  return {
    today,
    daysLeft,
    perDay,
    remaining,
    doneToday: doneToday.length,
    todayItems,
    totalItems,
    doneTotal,
    percentGlobal: totalItems ? Math.round((doneTotal / totalItems) * 100) : 0,
    finished: remaining === 0
  };
}

// Racha de estudio: días consecutivos (terminando hoy o ayer) con actividad.
// Cuenta como "día activo" completar un item o hacer al menos un pomodoro.
export function studyStreak(doneMap, pomoMap = {}) {
  const days = new Set();
  for (const ts of Object.values(doneMap)) {
    if (typeof ts === 'string') days.add(ts.slice(0, 10));
  }
  for (const [d, n] of Object.entries(pomoMap)) {
    if (n > 0) days.add(d);
  }
  const cursor = new Date(`${todayISO()}T00:00:00`);
  const has = (dt) => days.has(isoDate(dt));
  // Si hoy aún no hay actividad, la racha puede venir desde ayer sin romperse.
  if (!has(cursor)) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (has(cursor)) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// Progreso por materia: { subjectId: {done, total, percent} }.
export function progressBySubject(items, doneMap) {
  const acc = {};
  for (const it of items) {
    const s = (acc[it.subject] = acc[it.subject] || { done: 0, total: 0, percent: 0 });
    s.total += 1;
    if (doneMap[it.id]) s.done += 1;
  }
  for (const s of Object.values(acc)) {
    s.percent = s.total ? Math.round((s.done / s.total) * 100) : 0;
  }
  return acc;
}
