const API_URL = 'http://localhost:3000/api';

// Centraliza las llamadas con fetch, adjunta el token JWT y maneja errores HTTP
export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && endpoint !== '/auth/login') {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.reload();
    }
    const detalle = data.errores ? data.errores.map((e) => e.msg).join(', ') : '';
    throw new Error(detalle || data.mensaje || 'Error en la peticion');
  }

  return data;
}