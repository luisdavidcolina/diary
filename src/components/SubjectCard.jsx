import React from 'react';
import { Link } from 'react-router-dom';

const SubjectCard = ({ subject, progress }) => {
  const pct = progress?.percent ?? 0;
  const done = progress?.done ?? 0;
  const total = progress?.total ?? 0;

  return (
    <Link to={`/subject/${subject.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="subject-card glass-panel" style={{ cursor: 'pointer' }}>
        <div className="subject-header">
          <div className="subject-icon" style={{ color: subject.color }}>
            {subject.icon}
          </div>
          <div className="subject-info">
            <h3>{subject.title}</h3>
          </div>
        </div>
        <p className="muted">{subject.goal}</p>

        <div className="subject-progress-container">
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${pct}%`, backgroundColor: subject.color }}
            />
          </div>
          <div className="progress-text">
            <span>Progreso: {pct}%</span>
            <span>{done}/{total} temas</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default SubjectCard;
