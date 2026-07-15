import React, { useState, useEffect } from 'react';

const subjects = [
  {
    id: 'english',
    title: 'Inglés (Suficiencia)',
    icon: '🇬🇧',
    color: 'var(--color-english)',
    progress: 15,
    tasks: '2/15 tareas'
  },
  {
    id: 'calculus',
    title: 'Cálculo Científico',
    icon: '🧮',
    color: 'var(--color-calculus)',
    progress: 33,
    tasks: '1/3 parciales'
  },
  {
    id: 'security',
    title: 'Seguridad en Redes',
    icon: '🛡️',
    color: 'var(--color-security)',
    progress: 0,
    tasks: '0/10 temas'
  },
  {
    id: 'cloud',
    title: 'Computación Cloud',
    icon: '☁️',
    color: 'var(--color-cloud)',
    progress: 5,
    tasks: '1/20 conceptos'
  }
];

function App() {
  const [daysLeft, setDaysLeft] = useState(60);

  // Simulating countdown for demonstration
  useEffect(() => {
    const timer = setInterval(() => {
      setDaysLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 86400000); // every day
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <header className="header">
        <h1 className="text-gradient">Diary</h1>
        <p>Tu centro de control para los próximos 2 meses</p>
        
        <div className="countdown-container">
          <div className="countdown-box glass-panel">
            <span className="countdown-number">{Math.floor(daysLeft / 30)}</span>
            <span className="countdown-label">Meses</span>
          </div>
          <div className="countdown-box glass-panel">
            <span className="countdown-number">{daysLeft % 30}</span>
            <span className="countdown-label">Días</span>
          </div>
          <div className="countdown-box glass-panel" style={{ '--accent-color': '#ef4444', '--accent-glow': 'rgba(239, 68, 68, 0.5)' }}>
            <span className="countdown-number" style={{ color: '#ef4444' }}>00</span>
            <span className="countdown-label">Horas</span>
          </div>
        </div>
      </header>

      <main className="grid">
        {subjects.map((subject) => (
          <div key={subject.id} className="subject-card glass-panel">
            <div className="subject-header">
              <div className="subject-icon" style={{ color: subject.color }}>
                {subject.icon}
              </div>
              <div className="subject-info">
                <h3>{subject.title}</h3>
              </div>
            </div>
            <p>Haz clic para ver detalles y tareas pendientes.</p>
            
            <div className="subject-progress-container">
              <div className="progress-bar-bg">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${subject.progress}%`, backgroundColor: subject.color, boxShadow: `0 0 10px ${subject.color}` }}
                ></div>
              </div>
              <div className="progress-text">
                <span>Progreso: {subject.progress}%</span>
                <span>{subject.tasks}</span>
              </div>
            </div>
          </div>
        ))}
      </main>
    </>
  );
}

export default App;
