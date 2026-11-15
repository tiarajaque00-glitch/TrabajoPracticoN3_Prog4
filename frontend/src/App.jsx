import { useState } from 'react';
import InicioPublico from './pages/InicioPublico';

export default function App() {
  const [mostrarLogin, setMostrarLogin] = useState(false);

  return <InicioPublico onIrLogin={() => setMostrarLogin(true)} />;
}