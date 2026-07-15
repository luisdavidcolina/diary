import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithEmail } from '../services/auth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginWithEmail(email, password);
      // Login exitoso, la ruta protegida lo dejará pasar ahora
      navigate('/');
    } catch (err) {
      setError('Credenciales incorrectas o usuario no encontrado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      flexDirection: 'column'
    }}>
      <div className="glass-panel" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <h1 className="text-gradient" style={{ marginBottom: '0.5rem' }}>Diary</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Centro de Control Estudiantil</p>
        
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input 
            type="email" 
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '8px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--glass-border)',
              color: 'white',
              fontFamily: 'inherit'
            }}
          />
          <input 
            type="password" 
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '8px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--glass-border)',
              color: 'white',
              fontFamily: 'inherit'
            }}
          />
          
          <button 
            type="submit"
            disabled={loading}
            style={{
              background: 'var(--accent-color)',
              color: 'white',
              border: 'none',
              padding: '1rem',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '1rem',
              transition: 'opacity 0.2s'
            }}
          >
            {loading ? 'Accediendo...' : 'Entrar al Diario'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
