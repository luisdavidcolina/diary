import React from 'react';
import Countdown from '../components/Countdown';
import SubjectCard from '../components/SubjectCard';

const subjects = [
  {
    id: 'english',
    title: 'Inglés (Suficiencia)',
    icon: '🇬🇧',
    color: 'var(--color-english)',
    progress: 0,
    tasks: 'Fase 1'
  },
  {
    id: 'calculus',
    title: 'Cálculo Científico',
    icon: '🧮',
    color: 'var(--color-calculus)',
    progress: 33,
    tasks: '2 parciales restantes'
  },
  {
    id: 'security',
    title: 'Seguridad en Redes',
    icon: '🛡️',
    color: 'var(--color-security)',
    progress: 0,
    tasks: 'Conceptos'
  },
  {
    id: 'cloud',
    title: 'Computación Cloud',
    icon: '☁️',
    color: 'var(--color-cloud)',
    progress: 0,
    tasks: 'Conceptos'
  }
];

const Dashboard = () => {
  return (
    <>
      <header className="header">
        <h1 className="text-gradient">Diary</h1>
        <p>Tu centro de control hasta septiembre</p>
        <Countdown />
      </header>

      <div className="grid">
        {subjects.map((subject) => (
          <SubjectCard key={subject.id} subject={subject} />
        ))}
      </div>
    </>
  );
};

export default Dashboard;
