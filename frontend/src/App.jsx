import { useState } from 'react';
import InicioPublico from './pages/InicioPublico';
import Login from './pages/Login';
import Vehiculos from './pages/Vehiculos';
import Conductores from './pages/Conductores';
import Viajes from './pages/Viajes';

export default function App() {
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem('usuario');
    return guardado ? JSON.parse(guardado) : null;
  });
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [vista, setVista] = useState('viajes');

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

        <div className="nav-links">
          <button
            className={vista === 'viajes' ? 'active' : ''}
            onClick={() => setVista('viajes')}
          >
            Viajes e Historial
          </button>
          <button
            className={vista === 'vehiculos' ? 'active' : ''}
            onClick={() => setVista('vehiculos')}
          >
            Vehículos
          </button>
          <button
            className={vista === 'conductores' ? 'active' : ''}
            onClick={() => setVista('conductores')}
          >
            Conductores
          </button>
        </div>

        <div className="nav-user">
          <span>Hola, {usuario.nombre}</span>
          <button className="btn btn-small btn-secondary" onClick={cerrarSesion}>
            Salir
          </button>
        </div>
      </nav>

      <main className="main-content">
        {vista === 'viajes' && <Viajes />}
        {vista === 'vehiculos' && <Vehiculos />}
        {vista === 'conductores' && <Conductores />}
      </main>
    </div>
  );
}