import React, { useEffect, useState } from 'react';
import { SUBJECTS } from '../data/syllabus';
import { getQuiz } from '../data/quizzes';
import { getItemData, saveItemData } from '../services/store';

const uid = () => Math.random().toString(36).slice(2, 9);

// Taller de estudio de un item: Aprender · Repasar · Ejercicios.
const ItemWorkspace = ({ item, done, onToggleDone, onClose }) => {
  const subject = SUBJECTS[item.subject];
  const quiz = getQuiz(item.id);
  const [tab, setTab] = useState('aprender');
  const [data, setData] = useState(() => getItemData(item.id));

  // Recargar si cambia el item (reutiliza el mismo modal).
  useEffect(() => {
    setData(getItemData(item.id));
    setTab('aprender');
  }, [item.id]);

  // Cerrar con Escape.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const patch = (p) => setData(saveItemData(item.id, p));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal glass-panel" onClick={(e) => e.stopPropagation()} style={{ borderTop: `3px solid ${subject.color}` }}>
        <header className="modal-head">
          <div>
            <span className="checklist-unit">{item.unit}</span>
            <h2 style={{ margin: '0.35rem 0 0' }}>{item.title}</h2>
            <p className="muted" style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>{subject.title}</p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar">✕</button>
        </header>

        <label className="done-toggle">
          <input type="checkbox" checked={done} onChange={() => onToggleDone(item.id)} />
          <span>{done ? 'Tema completado ✓' : 'Marcar tema como completado'}</span>
        </label>

        <nav className="tabs">
          {[
            ['aprender', '📖 Aprender'],
            ['repasar', '🔁 Repasar'],
            ['ejercicios', '✏️ Ejercicios'],
            ...(quiz ? [['test', '🧠 Test']] : [])
          ].map(([id, label]) => (
            <button key={id} className={`tab ${tab === id ? 'is-active' : ''}`} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </nav>

        <div className="modal-body">
          {tab === 'aprender' && <LearnTab subject={subject} item={item} data={data} patch={patch} />}
          {tab === 'repasar' && <ReviewTab color={subject.color} data={data} patch={patch} />}
          {tab === 'ejercicios' && <ExercisesTab color={subject.color} data={data} patch={patch} />}
          {tab === 'test' && quiz && <QuizTab color={subject.color} quiz={quiz} />}
        </div>
      </div>
    </div>
  );
};

// ── Aprender: desglose del tema + apuntes + referencia al material ──
const LearnTab = ({ subject, item, data, patch }) => (
  <div>
    {item.details?.length > 0 && (
      <div className="topic-outline">
        <span className="topic-outline-title">Qué cubre este tema</span>
        <ul>
          {item.details.map((d, i) => <li key={i}>{d}</li>)}
        </ul>
      </div>
    )}
    <p className="muted" style={{ marginBottom: '0.75rem' }}>📂 Material: {subject.material}</p>
    <textarea
      className="note-input"
      rows="10"
      placeholder="Apuntes, conceptos clave, fórmulas, resumen con tus palabras…"
      value={data.notes}
      onChange={(e) => patch({ notes: e.target.value })}
    />
    <p className="muted" style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Se guarda automáticamente.</p>
  </div>
);

// ── Repasar: flashcards Q/A con modo estudio ──
const ReviewTab = ({ color, data, patch }) => {
  const [q, setQ] = useState('');
  const [a, setA] = useState('');
  const [studyIdx, setStudyIdx] = useState(null);
  const [flipped, setFlipped] = useState(false);

  const cards = data.cards || [];

  const addCard = (e) => {
    e.preventDefault();
    if (!q.trim() || !a.trim()) return;
    patch({ cards: [...cards, { id: uid(), q: q.trim(), a: a.trim() }] });
    setQ('');
    setA('');
  };
  const removeCard = (id) => patch({ cards: cards.filter((c) => c.id !== id) });

  if (studyIdx !== null && cards[studyIdx]) {
    const card = cards[studyIdx];
    return (
      <div className="study-mode">
        <div className="flashcard glass-panel" onClick={() => setFlipped((f) => !f)} style={{ borderColor: color }}>
          <span className="muted" style={{ fontSize: '0.75rem' }}>{flipped ? 'RESPUESTA' : 'PREGUNTA'} · clic para voltear</span>
          <p className="flashcard-text">{flipped ? card.a : card.q}</p>
        </div>
        <div className="study-nav">
          <span className="muted">{studyIdx + 1} / {cards.length}</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="ghost-btn" onClick={() => { setFlipped(false); setStudyIdx((i) => Math.max(0, i - 1)); }} disabled={studyIdx === 0}>← Anterior</button>
            {studyIdx < cards.length - 1
              ? <button className="primary-btn" style={{ background: color }} onClick={() => { setFlipped(false); setStudyIdx((i) => i + 1); }}>Siguiente →</button>
              : <button className="primary-btn" style={{ background: color }} onClick={() => setStudyIdx(null)}>Terminar</button>}
          </div>
        </div>
        <button className="link-btn" onClick={() => setStudyIdx(null)} style={{ marginTop: '0.5rem' }}>Salir del repaso</button>
      </div>
    );
  }

  return (
    <div>
      {cards.length > 0 && (
        <button className="primary-btn" style={{ background: color, marginBottom: '1rem' }} onClick={() => { setStudyIdx(0); setFlipped(false); }}>
          ▶ Repasar {cards.length} {cards.length === 1 ? 'tarjeta' : 'tarjetas'}
        </button>
      )}
      <form onSubmit={addCard} className="card-form">
        <input className="mini-input" placeholder="Pregunta" value={q} onChange={(e) => setQ(e.target.value)} />
        <input className="mini-input" placeholder="Respuesta" value={a} onChange={(e) => setA(e.target.value)} />
        <button type="submit" className="ghost-btn">+ Añadir</button>
      </form>
      {cards.length === 0 ? (
        <p className="muted">Crea tarjetas pregunta/respuesta para memorizar este tema.</p>
      ) : (
        <ul className="mini-list">
          {cards.map((c) => (
            <li key={c.id}>
              <span><strong>{c.q}</strong> → {c.a}</span>
              <button className="icon-btn" onClick={() => removeCard(c.id)} aria-label="Eliminar">✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ── Ejercicios: registro de práctica con checkboxes ──
const ExercisesTab = ({ color, data, patch }) => {
  const [text, setText] = useState('');
  const exercises = data.exercises || [];

  const add = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    patch({ exercises: [...exercises, { id: uid(), text: text.trim(), done: false }] });
    setText('');
  };
  const toggle = (id) => patch({ exercises: exercises.map((x) => (x.id === id ? { ...x, done: !x.done } : x)) });
  const remove = (id) => patch({ exercises: exercises.filter((x) => x.id !== id) });

  const doneCount = exercises.filter((x) => x.done).length;

  return (
    <div>
      <form onSubmit={add} className="card-form">
        <input className="mini-input" style={{ flex: 1 }} placeholder="Ejercicio a practicar (ej. Parcial 2016-II P3)" value={text} onChange={(e) => setText(e.target.value)} />
        <button type="submit" className="ghost-btn">+ Añadir</button>
      </form>
      {exercises.length === 0 ? (
        <p className="muted">Lista los ejercicios/modelos que vas a resolver de este tema.</p>
      ) : (
        <>
          <p className="muted" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>{doneCount}/{exercises.length} resueltos</p>
          <ul className="mini-list">
            {exercises.map((x) => (
              <li key={x.id} className={x.done ? 'is-done' : ''}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', flex: 1 }}>
                  <input type="checkbox" checked={x.done} onChange={() => toggle(x.id)} style={{ accentColor: color }} />
                  <span style={x.done ? { textDecoration: 'line-through', color: 'var(--text-secondary)' } : undefined}>{x.text}</span>
                </label>
                <button className="icon-btn" onClick={() => remove(x.id)} aria-label="Eliminar">✕</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

// ── Test: opción múltiple con autocorrección ──
const QuizTab = ({ color, quiz }) => {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const choose = (qi, oi) => {
    if (submitted) return;
    setAnswers((a) => ({ ...a, [qi]: oi }));
  };

  const score = quiz.reduce((acc, q, i) => acc + (answers[i] === q.answer ? 1 : 0), 0);
  const allAnswered = quiz.every((_, i) => answers[i] !== undefined);

  const reset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  return (
    <div className="quiz">
      {submitted && (
        <div className="quiz-score" style={{ borderColor: color }}>
          Puntaje: <strong>{score}/{quiz.length}</strong>{' '}
          {score === quiz.length ? '🎉 ¡Perfecto!' : score >= quiz.length / 2 ? '👍 Bien' : '📚 A repasar'}
        </div>
      )}

      {quiz.map((q, qi) => (
        <div key={qi} className="quiz-q">
          <p className="quiz-question">{qi + 1}. {q.q}</p>
          <div className="quiz-options">
            {q.options.map((opt, oi) => {
              const chosen = answers[qi] === oi;
              let cls = 'quiz-opt';
              if (submitted) {
                if (oi === q.answer) cls += ' correct';
                else if (chosen) cls += ' wrong';
              } else if (chosen) {
                cls += ' chosen';
              }
              return (
                <button
                  key={oi}
                  type="button"
                  className={cls}
                  onClick={() => choose(qi, oi)}
                  style={chosen && !submitted ? { borderColor: color } : undefined}
                >
                  {opt}
                  {submitted && oi === q.answer && ' ✓'}
                  {submitted && chosen && oi !== q.answer && ' ✗'}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {!submitted ? (
        <button className="primary-btn" style={{ background: color }} disabled={!allAnswered} onClick={() => setSubmitted(true)}>
          Corregir
        </button>
      ) : (
        <button className="ghost-btn" onClick={reset}>↺ Reintentar</button>
      )}
    </div>
  );
};

export default ItemWorkspace;
