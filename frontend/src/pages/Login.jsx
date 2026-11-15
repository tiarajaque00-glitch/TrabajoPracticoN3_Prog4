import { useState } from 'react';
import { apiFetch } from '../services/api';

export default function Login({ onLoginExitoso, onVolver }) {
  const [esRegistro, setEsRegistro] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');

    if (!email.includes('@') || contrasena.length < 6) {
      setError('Ingresá un email válido y una contraseña de al menos 6 caracteres.');
      return;
    }
    if (esRegistro && !nombre.trim()) {
      setError('El nombre es obligatorio para registrarse.');
      return;
    }

    try {
      if (esRegistro) {
        await apiFetch('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ nombre, email, contrasena })
        });
        setMensaje('Cuenta creada. Ahora podés iniciar sesión.');
        setEsRegistro(false);
        setContrasena('');
      } else {
        const data = await apiFetch('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, contrasena })
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        onLoginExitoso(data.usuario);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="card login-box">
        <h2>{esRegistro ? 'Crear Cuenta' : 'Ingreso al Sistema'}</h2>

        {error && <div className="alert alert-error">{error}</div>}
        {mensaje && <div className="alert alert-ok">{mensaje}</div>}

        <form onSubmit={manejarSubmit} className="form-stack">
          {esRegistro && (
            <label>
              Nombre completo
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </label>
          )}

          <label>
            Correo electrónico
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              minLength={6}
              required
            />
          </label>

          <button type="submit" className="btn btn-primary">
            {esRegistro ? 'Registrarme' : 'Entrar'}
          </button>
        </form>

        <div className="login-footer">
          <button
            type="button"
            className="btn-link"
            onClick={() => {
              setEsRegistro(!esRegistro);
              setError('');
            }}
          >
            {esRegistro ? 'Ya tengo cuenta, iniciar sesión' : '¿No tenés cuenta? Registrate'}
          </button>
          <button type="button" className="btn-link" onClick={onVolver}>
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}