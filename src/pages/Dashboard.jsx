import React, { useEffect, useMemo, useState } from 'react';
import Countdown from '../components/Countdown';
import SubjectCard from '../components/SubjectCard';
import TodayPlan from '../components/TodayPlan';
import ItemWorkspace from '../components/ItemWorkspace';
import Pomodoro from '../components/Pomodoro';
import { SUBJECTS, SUBJECT_ORDER, ITEMS } from '../data/syllabus';
import { buildPlan, progressBySubject, studyStreak } from '../services/planner';
import { getConfig, getDoneMap, getPomodoros, saveConfig, toggleDone } from '../services/store';
import { syncSyllabusIfNeeded, registerOwner } from '../services/db';

const Dashboard = () => {
  const [doneMap, setDoneMap] = useState(() => getDoneMap());
  const [config, setConfig] = useState(() => getConfig());
  const [showSettings, setShowSettings] = useState(false);
  const [openItem, setOpenItem] = useState(null);
  const [pomoMap, setPomoMap] = useState(() => getPomodoros());

  // Registra al dueño (para Telegram) y sube el temario a la BD una vez.
  useEffect(() => { registerOwner(); syncSyllabusIfNeeded(); }, []);

  const plan = useMemo(() => buildPlan(ITEMS, doneMap, config), [doneMap, config]);
  const progress = useMemo(() => progressBySubject(ITEMS, doneMap), [doneMap]);
  const streak = useMemo(() => studyStreak(doneMap, pomoMap), [doneMap, pomoMap]);

  const handleToggle = (id) => setDoneMap({ ...toggleDone(id) });

  const handleConfig = (patch) => setConfig(saveConfig(patch));

  return (
    <>
      <header className="header">
        <h1 className="text-gradient">Diary</h1>
        <p>
          Tu centro de control hasta septiembre · {plan.percentGlobal}% completado
          {streak > 0 && <span className="streak-badge">🔥 {streak} {streak === 1 ? 'día' : 'días'}</span>}
        </p>
        <Countdown targetDate={config.targetDate} />
        <button className="link-btn" onClick={() => setShowSettings((v) => !v)}>
          ⚙ Ajustes del plan
        </button>
        {showSettings && (
          <div className="settings glass-panel">
            <label>
              Fecha objetivo
              <input
                type="date"
                value={config.targetDate}
                onChange={(e) => handleConfig({ targetDate: e.target.value })}
              />
            </label>
            <label>
              Tareas/día (vacío = automático)
              <input
                type="number"
                min="1"
                value={config.perDayOverride ?? ''}
                placeholder={`auto: ${plan.perDay}`}
                onChange={(e) =>
                  handleConfig({ perDayOverride: e.target.value ? Number(e.target.value) : null })
                }
              />
            </label>
          </div>
        )}
      </header>

      <div className="dash-row">
        <div className="dash-main">
          <TodayPlan plan={plan} doneMap={doneMap} onToggle={handleToggle} onOpen={setOpenItem} />
        </div>
        <Pomodoro onComplete={() => setPomoMap({ ...getPomodoros() })} />
      </div>

      <div className="grid" style={{ marginTop: '2rem' }}>
        {SUBJECT_ORDER.map((sid) => (
          <SubjectCard key={sid} subject={SUBJECTS[sid]} progress={progress[sid]} />
        ))}
      </div>

      {openItem && (
        <ItemWorkspace
          item={openItem}
          done={Boolean(doneMap[openItem.id])}
          onToggleDone={handleToggle}
          onClose={() => setOpenItem(null)}
        />
      )}
    </>
  );
};

export default Dashboard;
