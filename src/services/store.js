// Persistencia del progreso y la configuración del plan.
// Por ahora usa localStorage (fiable, offline, sin depender de reglas de Firestore).
// La forma de los datos está pensada para migrar a Firestore sin tocar la UI:
//   - doneMap: { [itemId]: ISOdateTime }  → cuándo se completó cada item
//   - config:  { targetDate, perDayOverride }

const KEY_DONE = 'diary.progress.v1';
const KEY_CFG = 'diary.plan.v1';

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
