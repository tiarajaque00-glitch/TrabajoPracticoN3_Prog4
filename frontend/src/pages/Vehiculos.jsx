import { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';

const formInicial = {
  marca: '',
  modelo: '',
  patente: '',
  anio: '',
  capacidad_carga: ''
};

export default function Vehiculos() {
  const [vehiculos, setVehiculos] = useState([]);
  const [form, setForm] = useState(formInicial);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState('');

  const cargarVehiculos = async () => {
    try {
      const data = await apiFetch('/vehiculos');
      setVehiculos(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    cargarVehiculos();
  }, []);

  const manejarCambio = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const guardarVehiculo = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.marca.trim() || !form.modelo.trim() || !form.patente.trim()) {
      setError('Completá marca, modelo y patente.');
      return;
    }
    if (Number(form.anio) < 1950 || Number(form.capacidad_carga) <= 0) {
      setError('Verificá el año y que la capacidad de carga sea mayor a 0.');
      return;
    }

    try {
      const payload = {
        ...form,
        patente: form.patente.toUpperCase(),
        anio: Number(form.anio),
        capacidad_carga: Number(form.capacidad_carga)
      };

      if (editandoId) {
        await apiFetch(`/vehiculos/${editandoId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch('/vehiculos', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      setForm(formInicial);
      setEditandoId(null);
      cargarVehiculos();
    } catch (err) {
      setError(err.message);
    }
  };

  const iniciarEdicion = (v) => {
    setEditandoId(v.id);
    setForm({
      marca: v.marca,
      modelo: v.modelo,
      patente: v.patente,
      anio: v.anio,
      capacidad_carga: v.capacidad_carga
    });
    setError('');
  };

  const eliminarVehiculo = async (id) => {
    if (!window.confirm('¿Seguro que querés eliminar este vehículo?')) return;
    setError('');
    try {
      await apiFetch(`/vehiculos/${id}`, { method: 'DELETE' });
      cargarVehiculos();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section>
      <h2>Gestión de Vehículos</h2>
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={guardarVehiculo} className="card form-grid">
        <input
          name="marca"
          placeholder="Marca"
          value={form.marca}
          onChange={manejarCambio}
          required
        />
        <input
          name="modelo"
          placeholder="Modelo"
          value={form.modelo}
          onChange={manejarCambio}
          required
        />
        <input
          name="patente"
          placeholder="Patente (ej. AE452KL)"
          value={form.patente}
          onChange={manejarCambio}
          required
        />
        <input
          name="anio"
          type="number"
          placeholder="Año"
          value={form.anio}
          onChange={manejarCambio}
          required
        />
        <input
          name="capacidad_carga"
          type="number"
          step="0.01"
          placeholder="Capacidad carga (kg)"
          value={form.capacidad_carga}
          onChange={manejarCambio}
          required
        />

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {editandoId ? 'Actualizar' : 'Agregar Vehículo'}
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
              <th>Patente</th>
              <th>Marca y Modelo</th>
              <th>Año</th>
              <th>Capacidad (kg)</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {vehiculos.map((v) => (
              <tr key={v.id}>
                <td><strong>{v.patente}</strong></td>
                <td>{v.marca} {v.modelo}</td>
                <td>{v.anio}</td>
                <td>{v.capacidad_carga}</td>
                <td className="acciones">
                  <button className="btn btn-small" onClick={() => iniciarEdicion(v)}>
                    Editar
                  </button>
                  <button className="btn btn-small btn-danger" onClick={() => eliminarVehiculo(v.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}