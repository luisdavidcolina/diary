import React, { useState, useEffect } from 'react';
import { addJournalEntry, getJournalEntries, deleteJournalEntry } from '../services/db';

const MOODS = [
  { emoji: '🔥', label: 'Imparable' },
  { emoji: '😌', label: 'Tranquilo' },
  { emoji: '🫠', label: 'Quemado' },
  { emoji: '⛈️', label: 'Estresado' }
];

const Journal = () => {
  const [entries, setEntries] = useState([]);
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState(MOODS[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const data = await getJournalEntries();
      setEntries(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      await addJournalEntry(content, selectedMood.label);
      setContent('');
      loadEntries();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getMoodEmoji = (label) => {
    const mood = MOODS.find(m => m.label === label);
    return mood ? mood.emoji : '📝';
  };

  const handleDelete = async (id) => {
    setEntries((prev) => prev.filter((en) => en.id !== id));
    try {
      await deleteJournalEntry(id);
    } catch (error) {
      console.error(error);
      loadEntries();
    }
  };

  return (
    <div style={{ animation: 'fadeInUp 0.6s ease', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 className="text-gradient">Diario de Reflexión</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Vacíar tu mente es el primer paso para organizarla.</p>
      </header>

      {/* Editor del Diario */}
      <div className="glass-panel" style={{ marginBottom: '3rem' }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1rem' }}>
            {MOODS.map(mood => (
              <button
                type="button"
                key={mood.label}
                onClick={() => setSelectedMood(mood)}
                style={{
                  background: selectedMood.label === mood.label ? 'var(--brutal-yellow)' : 'transparent',
                  border: `3px solid ${selectedMood.label === mood.label ? '#000' : 'transparent'}`,
                  padding: '0.5rem 1rem',
                  borderRadius: '0',
                  color: '#000',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{mood.emoji}</span>
                <span>{mood.label}</span>
              </button>
            ))}
          </div>

          <textarea
            placeholder="¿Qué tienes en mente hoy?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            required
            style={{
              width: '100%',
              padding: '1.5rem',
              borderRadius: '0',
              background: '#fff',
              border: '3px solid #000',
              boxShadow: 'inset 4px 4px 0 rgba(0,0,0,0.05)',
              color: '#000',
              fontFamily: 'inherit',
              fontWeight: 600,
              fontSize: '1.1rem',
              lineHeight: '1.6',
              resize: 'vertical'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                background: 'var(--brutal-blue)', 
                color: '#000', 
                border: '3px solid #000', 
                padding: '0.75rem 2rem', 
                borderRadius: '0', 
                fontWeight: '900', 
                boxShadow: '4px 4px 0 #000',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Guardando...' : 'Guardar Reflexión'}
            </button>
          </div>
        </form>
      </div>

      {/* Línea de Tiempo (Feed) */}
      <div>
        <h2 style={{ marginBottom: '1.5rem', color: '#000' }}>Historial de Reflexiones</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {entries.length === 0 && <p style={{ color: '#000', fontWeight: 600 }}>No has escrito nada aún. ¡Empieza hoy!</p>}
          
          {entries.map(entry => (
            <div key={entry.id} className="glass-panel" style={{ position: 'relative' }}>
              <div style={{ 
                position: 'absolute', 
                top: '-15px', 
                left: '-15px', 
                fontSize: '2rem',
                background: 'var(--bg-color)',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--glass-border)'
              }}>
                {getMoodEmoji(entry.mood)}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingLeft: '1.5rem' }}>
                <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>{entry.mood}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {new Date(entry.createdAt).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    title="Eliminar"
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    🗑
                  </button>
                </div>
              </div>
              
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                {entry.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Journal;
