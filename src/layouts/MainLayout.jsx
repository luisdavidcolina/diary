import React, { useEffect, useRef } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { logout } from '../services/auth';

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
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 2rem',
        background: 'var(--glass-bg)',
        borderBottom: '1px solid var(--glass-border)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <NavLink to="/" style={({ isActive }) => ({
            color: isActive ? 'var(--accent-color)' : 'var(--text-primary)',
            textDecoration: 'none',
            fontWeight: isActive ? 'bold' : 'normal',
            transition: 'color 0.2s'
          })}>📚 Estudios</NavLink>
          
          <NavLink to="/finance" style={({ isActive }) => ({
            color: isActive ? 'var(--accent-color)' : 'var(--text-primary)',
            textDecoration: 'none',
            fontWeight: isActive ? 'bold' : 'normal',
            transition: 'color 0.2s'
          })}>💰 Finanzas</NavLink>
          
          <NavLink to="/lifestyle" style={({ isActive }) => ({
            color: isActive ? 'var(--accent-color)' : 'var(--text-primary)',
            textDecoration: 'none',
            fontWeight: isActive ? 'bold' : 'normal',
            transition: 'color 0.2s'
          })}>🧘 Organización</NavLink>

          <NavLink to="/journal" style={({ isActive }) => ({
            color: isActive ? 'var(--accent-color)' : 'var(--text-primary)',
            textDecoration: 'none',
            fontWeight: isActive ? 'bold' : 'normal',
            transition: 'color 0.2s'
          })}>📝 Diario</NavLink>

          <NavLink to="/library" style={({ isActive }) => ({
            color: isActive ? 'var(--accent-color)' : 'var(--text-primary)',
            textDecoration: 'none',
            fontWeight: isActive ? 'bold' : 'normal',
            transition: 'color 0.2s'
          })}>🔖 Biblioteca</NavLink>
        </div>
        
        <button 
          onClick={logout}
          style={{
            background: 'transparent',
            color: 'var(--text-secondary)',
            border: '1px solid var(--glass-border)',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
          onMouseOut={(e) => e.target.style.background = 'transparent'}
        >
          Cerrar Sesión
        </button>
      </nav>

      <main style={{ padding: '2rem' }}>
        <Outlet />
      </main>
    </>
  );
};

export default MainLayout;
