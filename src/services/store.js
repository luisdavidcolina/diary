// Persistencia del progreso y la configuración del plan.
// Por ahora usa localStorage (fiable, offline, sin depender de reglas de Firestore).
// La forma de los datos está pensada para migrar a Firestore sin tocar la UI:
//   - doneMap: { [itemId]: ISOdateTime }  → cuándo se completó cada item
//   - config:  { targetDate, perDayOverride }

const KEY_DONE = 'diary.progress.v1';
const KEY_CFG = 'diary.plan.v1';
const KEY_ITEMS = 'diary.items.v1';
const KEY_POMO = 'diary.pomo.v1';

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const DEFAULT_CONFIG = {
  // Fecha tentativa de reanudación de clases tras el terremoto.
  targetDate: '2026-09-01',
  // null = automático (ceil(pendientes / díasRestantes)). Número = meta fija por día.
  perDayOverride: null
};

export function getDoneMap() {
  try {
    return JSON.parse(localStorage.getItem(KEY_DONE)) || {};
  } catch {
    return {};
  }
}

function saveDoneMap(map) {
  localStorage.setItem(KEY_DONE, JSON.stringify(map));
}

export function toggleDone(itemId) {
  const map = getDoneMap();
  if (map[itemId]) {
    delete map[itemId];
  } else {
    map[itemId] = new Date().toISOString();
  }
  saveDoneMap(map);
  return map;
}

export function getConfig() {
  try {
    return { ...DEFAULT_CONFIG, ...(JSON.parse(localStorage.getItem(KEY_CFG)) || {}) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(patch) {
  const next = { ...getConfig(), ...patch };
  localStorage.setItem(KEY_CFG, JSON.stringify(next));
  return next;
}

// ─────────── Contenido de estudio por item ───────────
// { [itemId]: { notes, cards: [{id,q,a}], exercises: [{id,text,done}] } }

const EMPTY_ITEM = { notes: '', cards: [], exercises: [] };

function getAllItemData() {
  try {
    return JSON.parse(localStorage.getItem(KEY_ITEMS)) || {};
  } catch {
    return {};
  }
}

export function getItemData(itemId) {
  const all = getAllItemData();
  return { ...EMPTY_ITEM, ...(all[itemId] || {}) };
}

export function saveItemData(itemId, patch) {
  const all = getAllItemData();
  const next = { ...EMPTY_ITEM, ...(all[itemId] || {}), ...patch };
  all[itemId] = next;
  localStorage.setItem(KEY_ITEMS, JSON.stringify(all));
  return next;
}

// ¿El item tiene algo de contenido guardado? (para mostrar indicador)
export function itemHasContent(itemId) {
  const d = getAllItemData()[itemId];
  if (!d) return false;
  return Boolean(d.notes?.trim()) || (d.cards?.length ?? 0) > 0 || (d.exercises?.length ?? 0) > 0;
}

// ─────────── Pomodoros ───────────
// { [dateISO]: count }

export function getPomodoros() {
  try {
    return JSON.parse(localStorage.getItem(KEY_POMO)) || {};
  } catch {
    return {};
  }
}

export function addPomodoro() {
  const all = getPomodoros();
  const day = todayKey();
  all[day] = (all[day] || 0) + 1;
  localStorage.setItem(KEY_POMO, JSON.stringify(all));
  return all;
}

export function pomodorosToday() {
  return getPomodoros()[todayKey()] || 0;
}
