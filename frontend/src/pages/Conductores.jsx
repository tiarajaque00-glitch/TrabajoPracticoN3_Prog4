import { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';

const formInicial = {
  nombre: '',
  apellido: '',
  numero_documento: '',
  numero_licencia: '',
  fecha_alta_licencia: '',
  fecha_vencimiento_licencia: ''
};

export default function Conductores() {
  const [conductores, setConductores] = useState([]);
  const [form, setForm] = useState(formInicial);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState('');

  const cargarConductores = async () => {
    try {
      const data = await apiFetch('/conductores');
      setConductores(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    cargarConductores();
  }, []);

  const manejarCambio = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const formatearFechaInput = (fechaStr) => (fechaStr ? fechaStr.split('T')[0] : '');

  const guardarConductor = async (e) => {
    e.preventDefault();
    setError('');

    if (new Date(form.fecha_vencimiento_licencia) <= new Date(form.fecha_alta_licencia)) {
      setError('El vencimiento de licencia debe ser posterior a la fecha de alta.');
      return;
    }

    try {
      if (editandoId) {
        await apiFetch(`/conductores/${editandoId}`, {
          method: 'PUT',
          body: JSON.stringify(form)
        });
      } else {
        await apiFetch('/conductores', {
          method: 'POST',
          body: JSON.stringify(form)
        });
      }

      setForm(formInicial);
      setEditandoId(null);
      cargarConductores();
    } catch (err) {
      setError(err.message);
    }
  };

  const iniciarEdicion = (c) => {
    setEditandoId(c.id);
    setForm({
      nombre: c.nombre,
      apellido: c.apellido,
      numero_documento: c.numero_documento,
      numero_licencia: c.numero_licencia,
      fecha_alta_licencia: formatearFechaInput(c.fecha_alta_licencia),
      fecha_vencimiento_licencia: formatearFechaInput(c.fecha_vencimiento_licencia)
    });
    setError('');
  };

  const eliminarConductor = async (id) => {
    if (!window.confirm('¿Eliminar este conductor?')) return;
    setError('');
    try {
      await apiFetch(`/conductores/${id}`, { method: 'DELETE' });
      cargarConductores();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section>
      <h2>Gestión de Conductores</h2>
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={guardarConductor} className="card form-grid">
        <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={manejarCambio} required />
        <input name="apellido" placeholder="Apellido" value={form.apellido} onChange={manejarCambio} required />
        <input name="numero_documento" placeholder="DNI" value={form.numero_documento} onChange={manejarCambio} required />
        <input name="numero_licencia" placeholder="N° Licencia" value={form.numero_licencia} onChange={manejarCambio} required />
        <label className="inline-label">
          Alta Licencia:
          <input type="date" name="fecha_alta_licencia" value={form.fecha_alta_licencia} onChange={manejarCambio} required />
        </label>
        <label className="inline-label">
          Vencimiento:
          <input type="date" name="fecha_vencimiento_licencia" value={form.fecha_vencimiento_licencia} onChange={manejarCambio} required />
        </label>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {editandoId ? 'Actualizar' : 'Agregar Conductor'}
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

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Conductor</th>
              <th>DNI</th>
              <th>Licencia</th>
              <th>Alta</th>
              <th>Vencimiento</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {conductores.map((c) => (
              <tr key={c.id}>
                <td>{c.apellido}, {c.nombre}</td>
                <td>{c.numero_documento}</td>
                <td>{c.numero_licencia}</td>
                <td>{formatearFechaInput(c.fecha_alta_licencia)}</td>
                <td>{formatearFechaInput(c.fecha_vencimiento_licencia)}</td>
                <td className="acciones">
                  <button className="btn btn-small" onClick={() => iniciarEdicion(c)}>Editar</button>
                  <button className="btn btn-small btn-danger" onClick={() => eliminarConductor(c.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}