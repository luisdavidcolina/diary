import React, { useEffect, useRef } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { logout } from '../services/auth';
import AssistantChat from '../components/AssistantChat';

const MainLayout = () => {
  const timeoutRef = useRef(null);

  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // 10 minutos de inactividad = cierre de sesión
    timeoutRef.current = setTimeout(() => {
      console.log("Sesión cerrada por inactividad (10 min)");
      logout();
    }, 600000);
  };

  useEffect(() => {
    resetTimer();
    
    const events = ['mousemove', 'mousedown', 'keypress', 'touchmove', 'scroll'];
    const handleActivity = () => resetTimer();
    
    events.forEach(evt => window.addEventListener(evt, handleActivity));
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach(evt => window.removeEventListener(evt, handleActivity));
    };
  }, []);

  return (
    <>
      <nav className="top-nav">
        <div className="nav-links">
          <NavLink to="/" className={({ isActive }) => isActive ? 'nav-btn active' : 'nav-btn'}>📚 Estudios</NavLink>
          <NavLink to="/calendar" className={({ isActive }) => isActive ? 'nav-btn active' : 'nav-btn'}>📅 Calendario</NavLink>
          <NavLink to="/finance" className={({ isActive }) => isActive ? 'nav-btn active' : 'nav-btn'}>💰 Finanzas</NavLink>
          <NavLink to="/lifestyle" className={({ isActive }) => isActive ? 'nav-btn active' : 'nav-btn'}>🧘 Organización</NavLink>
          <NavLink to="/journal" className={({ isActive }) => isActive ? 'nav-btn active' : 'nav-btn'}>📝 Diario</NavLink>
          <NavLink to="/library" className={({ isActive }) => isActive ? 'nav-btn active' : 'nav-btn'}>🔖 Biblioteca</NavLink>
          <NavLink to="/asistente" className={({ isActive }) => isActive ? 'nav-btn active' : 'nav-btn'}>🧠 Luisda Bot</NavLink>
        </div>
        
        <button 
          onClick={logout}
          className="nav-btn"
          style={{ background: 'var(--brutal-pink)' }}
        >
          Cerrar Sesión
        </button>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>

      <AssistantChat />
    </>
  );
};

export default MainLayout;
