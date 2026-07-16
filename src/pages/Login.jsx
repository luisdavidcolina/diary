import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithEmail, resetPassword } from '../services/auth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await loginWithEmail(email, password);
      navigate('/');
    } catch (err) {
      setError('Credenciales incorrectas o usuario no encontrado.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Por favor, ingresa tu correo arriba para recuperar tu contraseña.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    
    try {
      await resetPassword(email);
      setMessage('Te hemos enviado un correo para restablecer tu contraseña. Revisa tu bandeja de entrada o spam.');
    } catch (err) {
      setError('Error al intentar enviar el correo de recuperación. Verifica que el correo esté escrito correctamente.');
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
      <div className="glass-panel" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '2rem' }}>
        <h1 className="text-gradient" style={{ marginBottom: '0.5rem' }}>Diary</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Sistema Operativo Personal</p>
        
        {error && (
          <div style={{ background: '#fca5a5', color: '#000', padding: '0.75rem', borderRadius: '0', marginBottom: '1rem', border: '3px solid #000', fontWeight: 600 }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{ background: 'var(--brutal-green)', color: '#000', padding: '0.75rem', borderRadius: '0', marginBottom: '1rem', border: '3px solid #000', fontWeight: 600 }}>
            {message}
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
              borderRadius: '0',
              background: '#fff',
              border: '3px solid #000',
              color: '#000',
              fontFamily: 'inherit',
              fontWeight: 600,
              boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.1)'
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
              borderRadius: '0',
              background: '#fff',
              border: '3px solid #000',
              color: '#000',
              fontFamily: 'inherit',
              fontWeight: 600,
              boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.1)'
            }}
          />
          
          <button 
            type="submit"
            disabled={loading}
            style={{
              background: 'var(--brutal-yellow)',
              color: '#000',
              border: '3px solid #000',
              padding: '1rem',
              borderRadius: '0',
              fontWeight: '900',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '0.5rem',
              boxShadow: '4px 4px 0 #000',
              transition: 'transform 0.15s, box-shadow 0.15s'
            }}
          >
            {loading ? 'Procesando...' : 'Entrar al Diario'}
          </button>
        </form>

        <button 
          onClick={handleResetPassword}
          disabled={loading}
          style={{
            background: 'transparent',
            color: 'var(--text-secondary)',
            border: 'none',
            padding: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: '0.5rem',
            textDecoration: 'underline',
            fontSize: '0.9rem'
          }}
        >
          ¿Olvidaste o quieres cambiar tu contraseña?
        </button>
      </div>
    </div>
  );
};

export default Login;
