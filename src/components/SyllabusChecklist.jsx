import React from 'react';
import { SUBJECTS } from '../data/syllabus';

// Lista de items de temario con casilla de verificación.
// `showSubject` añade un punto de color con la materia (útil en la vista "Hoy").
const SyllabusChecklist = ({ items, doneMap, onToggle, showSubject = false, emptyLabel }) => {
  if (!items.length) {
    return <p className="muted">{emptyLabel || 'No hay items.'}</p>;
  }

  return (
    <ul className="checklist">
      {items.map((it) => {
        const done = Boolean(doneMap[it.id]);
        const subject = SUBJECTS[it.subject];
        return (
          <li key={it.id} className={`checklist-item ${done ? 'is-done' : ''}`}>
            <label>
              <input type="checkbox" checked={done} onChange={() => onToggle(it.id)} />
              <span className="checklist-box" style={done ? { background: subject.color, borderColor: subject.color } : undefined} />
              <span className="checklist-text">
                {showSubject && (
                  <span className="subject-dot" style={{ background: subject.color }} title={subject.title} />
                )}
                <span className="checklist-unit">{it.unit}</span>
                <span>{it.title}</span>
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
};

export default SyllabusChecklist;
