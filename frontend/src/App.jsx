import { useState } from 'react';
import InicioPublico from './pages/InicioPublico';
import Login from './pages/login';

export default function App() {
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem('usuario');
    return guardado ? JSON.parse(guardado) : null;
  });
  const [mostrarLogin, setMostrarLogin] = useState(false);

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
    setMostrarLogin(false);
  };

  if (!usuario) {
    if (mostrarLogin) {
      return (
        <Login
          onLoginExitoso={(user) => {
            setUsuario(user);
            setMostrarLogin(false);
          }}
          onVolver={() => setMostrarLogin(false)}
        />
      );
    }
    return <InicioPublico onIrLogin={() => setMostrarLogin(true)} />;
  }

  return (
    <div className="app-layout">
      <nav className="navbar">
        <div className="nav-brand">TransLogística</div>
        <div className="nav-user">
          <span>Hola, {usuario.nombre}</span>
          <button className="btn btn-small btn-secondary" onClick={cerrarSesion}>
            Salir
          </button>
        </div>
      </nav>

      <main className="main-content">
        <div className="card">
          <h2>Panel de Gestión</h2>
          <p>Sesión iniciada correctamente.</p>
        </div>
      </main>
    </div>
  );
}