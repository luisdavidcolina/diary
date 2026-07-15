import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getNotes, addNote } from '../services/db';
import { SUBJECTS, ITEMS_BY_SUBJECT } from '../data/syllabus';
import { getDoneMap, toggleDone } from '../services/store';
import { progressBySubject } from '../services/planner';
import SyllabusChecklist from '../components/SyllabusChecklist';

const SubjectDetail = () => {
  const { id } = useParams();
  const subject = SUBJECTS[id];
  const items = ITEMS_BY_SUBJECT[id] || [];

  const [doneMap, setDoneMap] = useState(() => getDoneMap());
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const data = await getNotes(id);
      setNotes(data);
    } catch (error) {
      console.error('Error cargando apuntes', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (itemId) => setDoneMap({ ...toggleDone(itemId) });

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      await addNote(id, newNote);
      setNewNote('');
      loadNotes();
    } catch (error) {
      console.error('Error guardando apunte', error);
    }
  };

  if (!subject) {
    return (
      <div style={{ textAlign: 'center', marginTop: '4rem' }}>
        Materia no encontrada. <Link to="/">Volver</Link>
      </div>
    );
  }

  const prog = progressBySubject(items, doneMap)[id] || { done: 0, total: items.length, percent: 0 };

  return (
    <div style={{ animation: 'fadeInUp 0.6s ease' }}>
      <Link to="/" className="back-link">&larr; Volver al Dashboard</Link>

      <div className="glass-panel subject-hero" style={{ borderColor: subject.color }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="subject-icon" style={{ color: subject.color, fontSize: '2rem', width: '64px', height: '64px' }}>
            {subject.icon}
          </div>
          <div>
            <h1 style={{ margin: 0 }}>{subject.title}</h1>
            <p className="muted" style={{ margin: 0 }}>{subject.goal}</p>
          </div>
        </div>
        <div className="progress-bar-bg" style={{ marginTop: '1rem' }}>
          <div className="progress-bar-fill" style={{ width: `${prog.percent}%`, backgroundColor: subject.color, boxShadow: `0 0 10px ${subject.color}` }} />
        </div>
        <div className="progress-text"><span>Progreso: {prog.percent}%</span><span>{prog.done}/{prog.total} temas</span></div>
      </div>

      <div className="grid">
        <div className="glass-panel">
          <h2>Temario</h2>
          <SyllabusChecklist items={items} doneMap={doneMap} onToggle={handleToggle} />
        </div>

        <div className="glass-panel">
          <h2>Apuntes</h2>
          <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Escribe un apunte, concepto o duda…"
              rows="3"
              className="note-input"
            />
            <button type="submit" className="primary-btn" style={{ background: subject.color, alignSelf: 'flex-start' }}>
              Guardar apunte
            </button>
          </form>

          {loading ? (
            <p className="muted">Cargando apuntes…</p>
          ) : notes.length === 0 ? (
            <p className="muted">Aún no tienes apuntes para esta materia.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {notes.map((note) => (
                <div key={note.id} className="note-card" style={{ borderLeft: `4px solid ${subject.color}` }}>
                  <p style={{ margin: 0 }}>{note.content}</p>
                  <span className="note-date">{new Date(note.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubjectDetail;
