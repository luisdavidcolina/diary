import React, { useState, useEffect } from 'react';

const Countdown = () => {
  const [daysLeft, setDaysLeft] = useState(60);

  useEffect(() => {
    // Para simplificar, asumimos que septiembre empieza en aprox 45-60 días.
    // Esto se puede reemplazar por un cálculo exacto a una fecha: new Date('2024-09-01')
    const timer = setInterval(() => {
      setDaysLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 86400000); 
    
    return () => clearInterval(timer);
  }, []);

  return (
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
  );
};

export default Countdown;
