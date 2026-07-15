import React, { useState, useEffect } from 'react';
import { addLibraryItem, getLibraryItems, updateLibraryItemStatus } from '../services/db';

const Library = () => {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState('article');
  const [activeTab, setActiveTab] = useState('unread'); // 'unread' or 'read'
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const data = await getLibraryItems();
      setItems(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Smart URL Detection
  const handleUrlChange = (e) => {
    const val = e.target.value;
    setUrl(val);
    
    if (val.includes('youtube.com') || val.includes('youtu.be')) {
      setType('video');
    } else if (val.includes('twitter.com') || val.includes('x.com')) {
      setType('social');
    } else if (val.trim() !== '') {
      setType('article');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await addLibraryItem(title, url, type);
      setTitle('');
      setUrl('');
      setType('article');
      loadItems();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'unread' ? 'read' : 'unread';
    try {
      await updateLibraryItemStatus(id, newStatus);
      loadItems();
    } catch (e) {
      console.error(e);
    }
  };

  const getTypeIcon = (itemType) => {
    switch (itemType) {
      case 'video': return '▶️';
      case 'social': return '🐦';
      case 'book': return '📚';
      default: return '📄';
    }
  };

  const filteredItems = items.filter(i => i.status === activeTab);

  return (
    <div style={{ animation: 'fadeInUp 0.6s ease' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="text-gradient">Biblioteca de Contenido</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Guarda enlaces, artículos y videos para leerlos más tarde.</p>
      </header>

      {/* Capturador de Contenido */}
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="Enlace (URL) - Opcional"
              value={url}
              onChange={handleUrlChange}
              style={{ flex: 1, minWidth: '200px', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white' }}
            />
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white' }}
            >
              <option value="article">📄 Artículo</option>
              <option value="video">▶️ Video</option>
              <option value="social">🐦 Red Social</option>
              <option value="book">📚 Libro</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="Título del recurso..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ flex: 3, minWidth: '200px', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white' }}
            />
            <button type="submit" disabled={loading} style={{ flex: 1, background: 'var(--accent-color)', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '8px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}>
              + Guardar
            </button>
          </div>
        </form>
      </div>

      {/* Tablero de Consumo */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('unread')}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            color: activeTab === 'unread' ? 'var(--accent-color)' : 'var(--text-secondary)',
            fontSize: '1.2rem',
            fontWeight: activeTab === 'unread' ? 'bold' : 'normal',
            cursor: 'pointer',
            padding: '0.5rem 1rem'
          }}
        >
          📥 Por Consumir ({items.filter(i => i.status === 'unread').length})
        </button>
        <button 
          onClick={() => setActiveTab('read')}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            color: activeTab === 'read' ? 'var(--color-cloud)' : 'var(--text-secondary)',
            fontSize: '1.2rem',
            fontWeight: activeTab === 'read' ? 'bold' : 'normal',
            cursor: 'pointer',
            padding: '0.5rem 1rem'
          }}
        >
          🗄️ Bóveda ({items.filter(i => i.status === 'read').length})
        </button>
      </div>

      <div className="grid">
        {filteredItems.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', gridColumn: '1 / -1' }}>
            No hay elementos en esta lista.
          </p>
        )}
        
        {filteredItems.map(item => (
          <div key={item.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{getTypeIcon(item.type)}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h3 style={{ margin: '0.5rem 0 1rem 0', fontSize: '1.1rem' }}>{item.title}</h3>
              {item.url && (
                <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-cloud)', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1rem', wordBreak: 'break-all' }}>
                  🔗 Abrir Enlace
                </a>
              )}
            </div>
            
            <button 
              onClick={() => handleToggleStatus(item.id, item.status)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '8px',
                border: `1px solid ${item.status === 'unread' ? 'var(--color-security)' : 'var(--text-secondary)'}`,
                background: item.status === 'unread' ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                color: item.status === 'unread' ? 'var(--color-security)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
            >
              {item.status === 'unread' ? '✓ Marcar como Leído' : '↩ Volver a Por Consumir'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Library;
