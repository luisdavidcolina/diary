import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getNotes, addNote } from '../services/db';

const subjectMap = {
  'english': { title: 'Inglés (Suficiencia)', color: 'var(--color-english)', icon: '🇬🇧' },
  'calculus': { title: 'Cálculo Científico', color: 'var(--color-calculus)', icon: '🧮' },
  'security': { title: 'Seguridad en Redes', color: 'var(--color-security)', icon: '🛡️' },
  'cloud': { title: 'Computación Cloud', color: 'var(--color-cloud)', icon: '☁️' }
};

const SubjectDetail = () => {
  const { id } = useParams();
  const subject = subjectMap[id];
  
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadNotes();
    }
  }, [id]);

  const loadNotes = async () => {
    try {
      const data = await getNotes(id);
      setNotes(data);
    } catch (error) {
      console.error("Error cargando apuntes", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    
    try {
      await addNote(id, newNote);
      setNewNote("");
      loadNotes(); // Recargar apuntes
    } catch (error) {
      console.error("Error guardando apunte", error);
    }
  };

  if (!subject) return <div style={{textAlign: 'center', marginTop: '4rem'}}>Materia no encontrada. <Link to="/">Volver</Link></div>;

  return (
    <div style={{ animation: 'fadeInUp 0.6s ease' }}>
      <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '2rem', display: 'inline-block' }}>
        &larr; Volver al Dashboard
      </Link>
      
      <div className="glass-panel" style={{ marginBottom: '2rem', borderColor: subject.color }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="subject-icon" style={{ color: subject.color, fontSize: '2rem', width: '64px', height: '64px' }}>
            {subject.icon}
          </div>
          <div>
            <h1 style={{ margin: 0 }}>{subject.title}</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Espacio de trabajo y apuntes</p>
          </div>
        </div>
      </div>

      <div className="grid">
        <div className="glass-panel">
          <h2>Nuevo Apunte</h2>
          <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <textarea 
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Escribe un apunte, concepto o tarea..."
              rows="4"
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '12px',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--glass-border)',
                color: 'white',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
            <button 
              type="submit"
              style={{
                background: subject.color,
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                alignSelf: 'flex-start',
                transition: 'opacity 0.2s'
              }}
            >
              Guardar Apunte
            </button>
          </form>
        </div>

        <div className="glass-panel" style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <h2>Mis Apuntes</h2>
          {loading ? (
            <p>Cargando apuntes...</p>
          ) : notes.length === 0 ? (
            <p>Aún no tienes apuntes para esta materia.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {notes.map(note => (
                <div key={note.id} style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  padding: '1rem', 
                  borderRadius: '8px',
                  borderLeft: `4px solid ${subject.color}`
                }}>
                  <p style={{ margin: 0, color: 'var(--text-primary)' }}>{note.content}</p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
                    {new Date(note.createdAt).toLocaleString()}
                  </span>
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
