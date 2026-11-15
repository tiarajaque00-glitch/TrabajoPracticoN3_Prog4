import { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';

const formInicial = {
  vehiculo_id: '',
  conductor_id: '',
  fecha_salida: '',
  fecha_llegada: '',
  origen: '',
  destino: '',
  kilometros: '',
  observaciones: ''
};

export default function Viajes() {
  const [viajes, setViajes] = useState([]);
  const [totalKm, setTotalKm] = useState(0);
  const [vehiculos, setVehiculos] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [form, setForm] = useState(formInicial);
  const [editandoId, setEditandoId] = useState(null);
  const [filtroVehiculo, setFiltroVehiculo] = useState('');
  const [filtroConductor, setFiltroConductor] = useState('');
  const [error, setError] = useState('');

  const cargarSelectores = async () => {
    try {
      const [listaVehiculos, listaConductores] = await Promise.all([
        apiFetch('/vehiculos'),
        apiFetch('/conductores')
      ]);
      setVehiculos(listaVehiculos);
      setConductores(listaConductores);
    } catch (err) {
      setError(err.message);
    }
  };

  const cargarViajes = async (vehId = filtroVehiculo, condId = filtroConductor) => {
    try {
      const params = new URLSearchParams();
      if (vehId) params.append('vehiculo_id', vehId);
      if (condId) params.append('conductor_id', condId);
      const query = params.toString() ? `?${params.toString()}` : '';

      const data = await apiFetch(`/viajes${query}`);
      setViajes(data.viajes);
      setTotalKm(data.total_kilometros);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    cargarSelectores();
    cargarViajes('', '');
  }, []);

  const manejarCambio = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const formatearFechaHoraInput = (fechaStr) => {
    if (!fechaStr) return '';
    return new Date(fechaStr).toISOString().slice(0, 16);
  };

  const guardarViaje = async (e) => {
    e.preventDefault();
    setError('');

    if (new Date(form.fecha_llegada) < new Date(form.fecha_salida)) {
      setError('La fecha de llegada no puede ser anterior a la salida.');
      return;
    }

    try {
      const payload = {
        ...form,
        vehiculo_id: Number(form.vehiculo_id),
        conductor_id: Number(form.conductor_id),
        kilometros: Number(form.kilometros)
      };

      if (editandoId) {
        await apiFetch(`/viajes/${editandoId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch('/viajes', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      setForm(formInicial);
      setEditandoId(null);
      cargarViajes();
    } catch (err) {
      setError(err.message);
    }
  };

  const iniciarEdicion = (v) => {
    setEditandoId(v.id);
    setForm({
      vehiculo_id: v.vehiculo_id,
      conductor_id: v.conductor_id,
      fecha_salida: formatearFechaHoraInput(v.fecha_salida),
      fecha_llegada: formatearFechaHoraInput(v.fecha_llegada),
      origen: v.origen,
      destino: v.destino,
      kilometros: v.kilometros,
      observaciones: v.observaciones || ''
    });
    setError('');
  };

  const eliminarViaje = async (id) => {
    if (!window.confirm('¿Eliminar este viaje del historial?')) return;
    setError('');
    try {
      await apiFetch(`/viajes/${id}`, { method: 'DELETE' });
      cargarViajes();
    } catch (err) {
      setError(err.message);
    }
  };

  const aplicarFiltroVehiculo = (val) => {
    setFiltroVehiculo(val);
    cargarViajes(val, filtroConductor);
  };

  const aplicarFiltroConductor = (val) => {
    setFiltroConductor(val);
    cargarViajes(filtroVehiculo, val);
  };

  return (
    <section>
      <h2>Registro e Historial de Viajes</h2>
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={guardarViaje} className="card form-grid">
        <select name="vehiculo_id" value={form.vehiculo_id} onChange={manejarCambio} required>
          <option value="">Seleccionar vehículo...</option>
          {vehiculos.map((v) => (
            <option key={v.id} value={v.id}>
              {v.patente} - {v.marca} {v.modelo}
            </option>
          ))}
        </select>

        <select name="conductor_id" value={form.conductor_id} onChange={manejarCambio} required>
          <option value="">Seleccionar conductor...</option>
          {conductores.map((c) => (
            <option key={c.id} value={c.id}>
              {c.apellido}, {c.nombre} (DNI {c.numero_documento})
            </option>
          ))}
        </select>

        <label className="inline-label">
          Salida:
          <input type="datetime-local" name="fecha_salida" value={form.fecha_salida} onChange={manejarCambio} required />
        </label>

        <label className="inline-label">
          Llegada:
          <input type="datetime-local" name="fecha_llegada" value={form.fecha_llegada} onChange={manejarCambio} required />
        </label>

        <input name="origen" placeholder="Origen" value={form.origen} onChange={manejarCambio} required />
        <input name="destino" placeholder="Destino" value={form.destino} onChange={manejarCambio} required />
        <input
          name="kilometros"
          type="number"
          step="0.01"
          placeholder="Kilómetros"
          value={form.kilometros}
          onChange={manejarCambio}
          required
        />
        <input
          name="observaciones"
          placeholder="Observaciones (opcional)"
          value={form.observaciones}
          onChange={manejarCambio}
        />

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {editandoId ? 'Actualizar Viaje' : 'Registrar Viaje'}
          </button>
          {editandoId && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setEditandoId(null);
                setForm(formInicial);
              }}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="card filter-bar">
        <div className="form-actions">
          <select value={filtroVehiculo} onChange={(e) => aplicarFiltroVehiculo(e.target.value)}>
            <option value="">Todos los vehículos</option>
            {vehiculos.map((v) => (
              <option key={v.id} value={v.id}>{v.patente} ({v.marca})</option>
            ))}
          </select>

          <select value={filtroConductor} onChange={(e) => aplicarFiltroConductor(e.target.value)}>
            <option value="">Todos los conductores</option>
            {conductores.map((c) => (
              <option key={c.id} value={c.id}>{c.apellido}, {c.nombre}</option>
            ))}
          </select>
        </div>

        <div className="km-badge">
          Total acumulado: <strong>{totalKm} km</strong>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Vehículo</th>
              <th>Conductor</th>
              <th>Tramo</th>
              <th>Salida / Llegada</th>
              <th>Km</th>
              <th>Observaciones</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {viajes.map((v) => (
              <tr key={v.id}>
                <td><strong>{v.patente}</strong> ({v.marca})</td>
                <td>{v.conductor_apellido}, {v.conductor_nombre}</td>
                <td>{v.origen} → {v.destino}</td>
                <td>
                  {new Date(v.fecha_salida).toLocaleString()} <br />
                  {new Date(v.fecha_llegada).toLocaleString()}
                </td>
                <td>{v.kilometros} km</td>
                <td>{v.observaciones || '-'}</td>
                <td className="acciones">
                  <button className="btn btn-small" onClick={() => iniciarEdicion(v)}>Editar</button>
                  <button className="btn btn-small btn-danger" onClick={() => eliminarViaje(v.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}