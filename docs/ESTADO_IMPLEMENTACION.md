# Estado de Implementación

> Análisis del código actual (`src/`) frente a las ideas de [IDEAS.md](IDEAS.md) y [ORGANIZACION_PERSONAL.md](ORGANIZACION_PERSONAL.md).
> Leyenda: ✅ funcional · 🟡 parcial · 🔴 roto/incompleto · ⚪ no empezado

---

## Módulos implementados

### 📚 Estudios — ✅ (Fases 1–3.5)
Planificador adaptativo, taller por tema (Aprender/Repasar/Ejercicios/Test), Pomodoro, racha, temario detallado.
- Persistencia en **localStorage** (a diferencia del resto, que usa Firestore).

### 💰 Finanzas — 🟡 funcional con huecos
- ✅ Tasas BCV/Binance (API pydólar, caché 4 h), cuentas multimoneda, patrimonio neto, transacciones.
- 🔴 `addOrUpdateAccount` **nunca actualiza** (siempre crea una nueva) — no hay editar/borrar cuentas.
- 🔴 Las **transacciones no afectan** el patrimonio ni el saldo de las cuentas (son solo un log).
- ⚪ Falta: presupuesto 50/30/20, suscripciones, metas de ahorro gamificadas.

### 🧘 Hábitos (Lifestyle) — 🔴 el más incompleto
- ✅ Captura rápida (crear tarea/hábito), listado separado.
- 🔴 **Los checkboxes no hacen nada** — sin `onChange`, sin persistir `isCompleted`, sin toggle.
- ⚪ Falta: heatmap estilo GitHub, XP/nivel, rutinas mañana/noche, Eisenhower, niveles de energía, NLP.

### 📝 Diario (Journal) — ✅ MVP sólido
- ✅ Escribir con mood, feed histórico con emoji y fecha.
- ⚪ Falta: editar/borrar entradas, análisis de sentimiento con IA (va para el final).

### 🔖 Biblioteca (Library) — ✅ MVP bueno
- ✅ Guardar enlaces, detección automática de tipo (YouTube/Twitter), pestañas Por Consumir/Bóveda, marcar leído.
- ⚪ Falta: borrar, highlights, ligar recursos a materias.

### 🔐 Login / Auth — ✅ (WIP tuyo)
- ✅ Login con persistencia + auditoría de IP/accesos. Recuperar contraseña en progreso.

---

## 🚩 Problemas transversales (afectan a varios módulos)

1. **Datos NO scopeados por usuario.** Las colecciones Firestore (`notes`, `transactions`, `accounts`, `lifestyle`, `journal_entries`, `library_items`) **no guardan `userId`**. Cualquier usuario logueado vería/editaría los datos de todos. Hay que añadir `userId` y filtrar por él. *(Prioridad de seguridad.)*
2. **Reglas de Firestore por confirmar** — si están en modo test, la base es pública.
3. **No se puede borrar** en casi ningún módulo (notas, transacciones, cuentas, hábitos, diario). Un error queda para siempre.
4. **Persistencia mixta**: Estudios usa localStorage; el resto Firestore. Decidir si unificar.
5. **Estilos inline muy repetidos** en las páginas de vida (vs. clases CSS del módulo de estudios) — dificulta mantener el look consistente.

---

## Ideas de los .md aún NO implementadas

**Productividad/organización:** heatmap de hábitos · XP/nivel global · rutinas mañana/noche · matriz de Eisenhower · niveles de energía · captura NLP · revisiones semanales · "Eat the Frog" · presupuesto 50/30/20 · suscripciones · metas de ahorro · highlights de biblioteca · fitness tracker.

**Para el final (lo pediste así):** IA (generador de variantes de inglés, flashcards automáticas, análisis de sentimiento, scheduling inteligente) · **bot de Telegram** para recordatorios.

---

## Orden propuesto

- **P0 — Arreglar lo roto + fundamentos** *(recomendado empezar aquí)*
  1. Hábitos: checkboxes funcionales + persistir completado + borrar.
  2. Añadir **borrar** en todos los módulos.
  3. **Scoping por `userId`** en Firestore (seguridad).
- **P1 — Completar features existentes**: transacciones→saldo, editar/borrar cuentas, presupuesto 50/30/20; borrar/editar diario; highlights biblioteca.
- **P2 — Nuevas de productividad**: heatmap hábitos, XP global, rutinas, Eisenhower, revisión semanal.
- **P3 — Último**: IA + Telegram.
