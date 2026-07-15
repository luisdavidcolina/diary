import React, { useEffect, useRef, useState } from 'react';
import { addPomodoro, pomodorosToday } from '../services/store';

const WORK = 25 * 60;
const BREAK = 5 * 60;

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

// Temporizador Pomodoro 25/5 con contador diario. Notifica al padre (onComplete)
// cada vez que se completa un bloque de trabajo, para refrescar la racha.
const Pomodoro = ({ onComplete }) => {
  const [mode, setMode] = useState('work'); // 'work' | 'break'
  const [seconds, setSeconds] = useState(WORK);
  const [running, setRunning] = useState(false);
  const [count, setCount] = useState(() => pomodorosToday());
  const tick = useRef(null);

  useEffect(() => {
    if (!running) return;
    tick.current = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(tick.current);
  }, [running]);

  useEffect(() => {
    if (seconds > 0) return;
    // Fin del bloque.
    setRunning(false);
    if (mode === 'work') {
      addPomodoro();
      setCount(pomodorosToday());
      onComplete && onComplete();
      setMode('break');
      setSeconds(BREAK);
    } else {
      setMode('work');
      setSeconds(WORK);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);

  const reset = () => {
    setRunning(false);
    setSeconds(mode === 'work' ? WORK : BREAK);
  };

  const progress = 1 - seconds / (mode === 'work' ? WORK : BREAK);

  return (
    <div className={`pomodoro glass-panel ${mode}`}>
      <div className="pomo-ring" style={{ '--p': progress }}>
        <span className="pomo-time">{fmt(seconds)}</span>
      </div>
      <div className="pomo-info">
        <span className="pomo-mode">{mode === 'work' ? '🎯 Enfoque' : '☕ Descanso'}</span>
        <div className="pomo-controls">
          <button className="ghost-btn" onClick={() => setRunning((r) => !r)}>
            {running ? '⏸ Pausar' : '▶ Iniciar'}
          </button>
          <button className="ghost-btn" onClick={reset}>↺</button>
        </div>
        <span className="muted" style={{ fontSize: '0.8rem' }}>🍅 {count} hoy</span>
      </div>
    </div>
  );
};

export default Pomodoro;
