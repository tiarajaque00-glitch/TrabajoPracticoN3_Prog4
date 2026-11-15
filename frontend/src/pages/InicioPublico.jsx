export default function InicioPublico({ onIrLogin }) {
  return (
    <div className="public-container">
      <header className="public-header">
        <h1>TransLogística S.A.</h1>
        <button className="btn btn-primary" onClick={onIrLogin}>
          Iniciar Sesión
        </button>
      </header>

      <main className="hero">
        <h2>Sistema de Gestión de Flota, Conductores y Viajes</h2>
        <p>
          Plataforma interna para el control operativo de unidades de carga,
          habilitaciones de choferes y seguimiento de kilometraje recorrido.
        </p>

        <div className="cards-grid">
          <div className="card">
            <h3>Control de Vehículos</h3>
            <p>Alta, baja y actualización de camiones, patentes y capacidad de carga.</p>
          </div>
          <div className="card">
            <h3>Legajo de Conductores</h3>
            <p>Registro de documentación, licencias profesionales y fechas de vencimiento.</p>
          </div>
          <div className="card">
            <h3>Historial y Kilometraje</h3>
            <p>Trazabilidad completa de recorridos y cálculo automático de kilómetros.</p>
          </div>
        </div>
      </main>
    </div>
  );
}