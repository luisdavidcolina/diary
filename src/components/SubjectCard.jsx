import React from 'react';
import { Link } from 'react-router-dom';

const SubjectCard = ({ subject }) => {
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
        <p>Haz clic para ver apuntes y tareas.</p>
        
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
    </Link>
  );
};

export default SubjectCard;
