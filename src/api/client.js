import axios from 'axios';

const TOKEN_KEY = 'rrhh_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

/** Cliente único de la API /api/v2/rrhh. */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api/v2/rrhh',
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// La app registra aquí qué hacer cuando la sesión expira (ver AuthContext).
let onNoAutenticado = () => {};
export const setOnNoAutenticado = (fn) => { onNoAutenticado = fn; };

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const esLogin = error.config?.url?.includes('auth/login');
    if (error.response?.status === 401 && !esLogin) {
      tokenStore.clear();
      onNoAutenticado();
    }
    return Promise.reject(error);
  },
);

/** Mensaje legible de un error de la API (los de negocio vienen en `message`). */
export function mensajeError(error, porDefecto = 'No se pudo completar la operación.') {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === 'ERR_NETWORK') return 'No hay conexión con el servidor de RR.HH.';
  return porDefecto;
}

/**
 * Descarga un PDF protegido (con el token) y lo abre en una pestaña nueva.
 * La pestaña se abre antes de la descarga para que el navegador no la bloquee.
 */
export async function abrirPdf(url) {
  const ventana = window.open('', '_blank');
  try {
    const r = await api.get(url, { responseType: 'blob' });
    const enlace = URL.createObjectURL(r.data);
    if (ventana) ventana.location.href = enlace;
    else window.location.href = enlace;
    setTimeout(() => URL.revokeObjectURL(enlace), 60000);
  } catch (error) {
    ventana?.close();
    // Los errores llegan como blob JSON: se leen para mostrar el mensaje.
    const blob = error?.response?.data;
    if (blob instanceof Blob) {
      try {
        error.response.data = JSON.parse(await blob.text());
      } catch {
        // sin mensaje legible
      }
    }
    throw error;
  }
}

/** Convierte la lista de empresas elegidas en el parámetro ?empresas= (vacío = todas). */
export const empresasParam = (codigos) => (codigos?.length ? { empresas: codigos.join(',') } : {});
