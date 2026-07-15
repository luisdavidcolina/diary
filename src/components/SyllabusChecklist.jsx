import React from 'react';
import { SUBJECTS } from '../data/syllabus';
import { itemHasContent } from '../services/store';

// Lista de items de temario con casilla de verificación.
// - checkbox → marca completado
// - clic en el texto → abre el taller (onOpen), si se provee
// `showSubject` añade un punto de color con la materia (útil en la vista "Hoy").
const SyllabusChecklist = ({ items, doneMap, onToggle, onOpen, showSubject = false, emptyLabel }) => {
  if (!items.length) {
    return <p className="muted">{emptyLabel || 'No hay items.'}</p>;
  }

  return (
    <ul className="checklist">
      {items.map((it) => {
        const done = Boolean(doneMap[it.id]);
        const subject = SUBJECTS[it.subject];
        const hasContent = itemHasContent(it.id);
        return (
          <li key={it.id} className={`checklist-item ${done ? 'is-done' : ''}`}>
            <span
              className="checklist-check"
              role="checkbox"
              aria-checked={done}
              tabIndex={0}
              onClick={() => onToggle(it.id)}
              onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && (e.preventDefault(), onToggle(it.id))}
            >
              <span className="checklist-box" style={done ? { background: subject.color, borderColor: subject.color } : undefined} />
            </span>
            <button
              type="button"
              className="checklist-text"
              onClick={() => onOpen && onOpen(it)}
              disabled={!onOpen}
            >
              {showSubject && (
                <span className="subject-dot" style={{ background: subject.color }} title={subject.title} />
              )}
              <span className="checklist-unit">{it.unit}</span>
              <span>{it.title}</span>
              {hasContent && <span className="content-dot" title="Tiene apuntes/tarjetas/ejercicios">•</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export default SyllabusChecklist;
