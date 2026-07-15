import React, { useMemo, useState } from 'react';
import Countdown from '../components/Countdown';
import SubjectCard from '../components/SubjectCard';
import TodayPlan from '../components/TodayPlan';
import { SUBJECTS, SUBJECT_ORDER, ITEMS } from '../data/syllabus';
import { buildPlan, progressBySubject } from '../services/planner';
import { getConfig, getDoneMap, saveConfig, toggleDone } from '../services/store';

const Dashboard = () => {
  const [doneMap, setDoneMap] = useState(() => getDoneMap());
  const [config, setConfig] = useState(() => getConfig());
  const [showSettings, setShowSettings] = useState(false);

  const plan = useMemo(() => buildPlan(ITEMS, doneMap, config), [doneMap, config]);
  const progress = useMemo(() => progressBySubject(ITEMS, doneMap), [doneMap]);

  const handleToggle = (id) => setDoneMap({ ...toggleDone(id) });

  const handleConfig = (patch) => setConfig(saveConfig(patch));

  return (
    <>
      <header className="header">
        <h1 className="text-gradient">Diary</h1>
        <p>Tu centro de control hasta septiembre · {plan.percentGlobal}% del temario completado</p>
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

      <TodayPlan plan={plan} doneMap={doneMap} onToggle={handleToggle} />

      <div className="grid" style={{ marginTop: '2rem' }}>
        {SUBJECT_ORDER.map((sid) => (
          <SubjectCard key={sid} subject={SUBJECTS[sid]} progress={progress[sid]} />
        ))}
      </div>
    </>
  );
};

export default Dashboard;
