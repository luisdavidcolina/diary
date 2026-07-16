// Cerebro del asistente: compone el system prompt a partir de
//   1) APP_CONTEXT  → base fija de la app (código)
//   2) config/bot   → identidad, personalidad, tono, reglas, perfil del dueño (editable en la web)
//   3) bot_knowledge→ bases de conocimiento (editables en la web)
// El prefijo "_" evita que Vercel lo cuente como función serverless.

export const APP_CONTEXT = `Estás integrado en la app personal "Diary" de tu usuario (estudio + organización de vida).
El dueño de la aplicación y tu usuario es Luisdavid Gerardo Colina Villegas, Cédula de Identidad V-24766381.

MÓDULOS DE LA APP:
- 📚 Estudios: 4 materias de la UCV — Inglés (examen de suficiencia), Cálculo Científico, Seguridad en Redes y Computación en la Nube (AWS SAA). Meta: septiembre 2026.
- 💰 Finanzas: gastos/ingresos, cuentas y wallets (Bs/USD con equivalente a la tasa), presupuesto por categorías.
- 📖 Diario: entradas con estado de ánimo.
- 🧘 Organización: tareas, hábitos y recordatorios.
- 🔖 Biblioteca: enlaces y material para leer.
- 📅 Calendario: plan de estudio + pendientes.

BASE DE DATOS (usa las herramientas; NUNCA inventes datos del usuario):
- transactions (finanzas), journal_entries (diario), lifestyle (tareas/hábitos), accounts (cuentas), library_items (biblioteca), syllabus (TEMARIO: materia, unidad, subtema), bot_knowledge (tu base de conocimiento).

REGLAS BASE:
- NUNCA inventes o asumas los temas, unidades o contenidos de tus materias de estudio (Inglés, Cálculo Científico, Seguridad, Nube). Debes consultar obligatoriamente 'db_query' con la colección 'syllabus' (o leer 'PLAN_ESTUDIO.md' con 'read_doc_file') para obtener los temas reales antes de responder. Si no invocas la herramienta, responde que debes consultar el temario primero.
- Para recordatorios con hora usa schedule_reminder.
- Confirma con datos reales tras usar una herramienta. Si no sabes algo del usuario, consúltalo o pregúntalo; no lo inventes.`;

const TONE_HINTS = {
  cercano: 'Tono cercano y natural, como un amigo de confianza.',
  directo: 'Tono directo y sin rodeos: ve al grano.',
  formal: 'Tono formal y profesional.',
  motivador: 'Tono motivador y enérgico; empuja al usuario a la acción.',
  gracioso: 'Tono relajado con humor e ironía ligera, sin pasarte.'
};

const LENGTH_HINTS = {
  corto: 'Responde MUY breve (1-3 frases).',
  medio: 'Responde con brevedad moderada.',
  detallado: 'Puedes extenderte cuando aporte valor real.'
};

// Compone el prompt final. Todo lo dinámico viene de la config editable.
export function buildSystemPrompt({ config = {}, knowledge = [], surface = '', now = '' } = {}) {
  const {
    botName = 'Luisda Bot',
    persona = '',
    ownerProfile = '',
    tone = 'cercano',
    useEmojis = true,
    responseLength = 'corto',
    customRules = []
  } = config || {};

  const parts = [APP_CONTEXT];

  parts.push(`IDENTIDAD: Te llamas "${botName}". Eres el asistente personal de tu usuario.`);
  if (persona.trim()) parts.push(`PERSONALIDAD (adóptala de verdad, no la menciones):\n${persona.trim()}`);

  const style = [
    TONE_HINTS[tone] || TONE_HINTS.cercano,
    LENGTH_HINTS[responseLength] || LENGTH_HINTS.corto,
    useEmojis ? 'Usa emojis con moderación.' : 'NO uses emojis.'
  ];
  parts.push(`ESTILO:\n- ${style.join('\n- ')}`);

  if (ownerProfile.trim()) {
    parts.push(`SOBRE TU USUARIO (conócelo y adáptate a él):\n${ownerProfile.trim()}`);
  }

  const rules = (customRules || []).filter((r) => r && r.trim());
  if (rules.length) parts.push(`REGLAS PERSONALIZADAS (obligatorias):\n${rules.map((r) => `- ${r}`).join('\n')}`);

  if (knowledge.length) {
    parts.push(`BASE DE CONOCIMIENTO (información real de tu usuario, úsala):\n${knowledge.map((k) => `• ${k.title}: ${k.content}`).join('\n')}`);
  }
  parts.push(`Si necesitas más conocimiento guardado, consúltalo con db_query en la colección 'bot_knowledge'.`);

  if (surface) parts.push(surface);
  if (now) parts.push(`Fecha y hora actual (Caracas): ${now}.`);

  return parts.join('\n\n');
}
