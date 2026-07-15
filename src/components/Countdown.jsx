import React, { useState, useEffect } from 'react';

// Cuenta regresiva a una fecha real (por defecto, reanudación en septiembre).
const Countdown = ({ targetDate }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const target = new Date(`${targetDate}T00:00:00`).getTime();
  const diff = Math.max(0, target - now);

  const totalDays = Math.floor(diff / 86400000);
  const months = Math.floor(totalDays / 30);
  const days = totalDays % 30;
  const hours = Math.floor((diff % 86400000) / 3600000);

  const boxes = [
    { value: months, label: 'Meses' },
    { value: days, label: 'Días' },
    { value: hours, label: 'Horas', urgent: true }
  ];

  return (
    <div className="countdown-container">
      {boxes.map((b) => (
        <div
          key={b.label}
          className="countdown-box glass-panel"
          style={b.urgent ? { '--accent-color': '#ef4444', '--accent-glow': 'rgba(239, 68, 68, 0.5)' } : undefined}
        >
          <span className="countdown-number" style={b.urgent ? { color: '#ef4444' } : undefined}>
            {String(b.value).padStart(2, '0')}
          </span>
          <span className="countdown-label">{b.label}</span>
        </div>
      ))}
    </div>
  );
};

export default Countdown;
