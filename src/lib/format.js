const SIGLAS = new Set(['SAC', 'S.A.C.', 'SRL', 'S.R.L.', 'SA', 'S.A.', 'EIRL', 'E.I.R.L.']);
const MENORES = new Set(['de', 'del', 'la', 'las', 'los', 'y']);

/** "CLINICA LA LUZ SAC" → "Clinica La Luz SAC" (la BD guarda los nombres en mayúsculas). */
export function nombreEmpresa(nombre) {
  if (!nombre) return '';
  return nombre
    .trim()
    .split(/\s+/)
    .map((palabra, i) => {
      if (SIGLAS.has(palabra.toUpperCase())) return palabra.toUpperCase();
      const min = palabra.toLowerCase();
      if (i > 0 && MENORES.has(min)) return min;
      return min.charAt(0).toUpperCase() + min.slice(1);
    })
    .join(' ');
}

const nf = new Intl.NumberFormat('es-PE');

/** Número con separador de miles; null o undefined → "—" (indicador que no aplica). */
export const numero = (valor) => (valor === null || valor === undefined ? '—' : nf.format(valor));

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];

/** '2026-11-30' (o '2026-11-30 10:00:00') → '30/11/2026'. Fecha "sin fin" (2050+) → 'Indeterminado'. */
export function fecha(valor) {
  if (!valor) return '—';
  const [a, m, d] = String(valor).slice(0, 10).split('-');
  if (Number(a) >= 2050) return 'Indeterminado';
  return `${d}/${m}/${a}`;
}

export function fechaHora(valor) {
  if (!valor) return '—';
  return `${fecha(valor)} ${String(valor).slice(11, 16)}`;
}

const soles = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });
export const moneda = (valor) => (valor === null || valor === undefined ? '—' : soles.format(valor));

/** 202611 → 'nov 2026' */
export const periodoTexto = (p) => (p ? `${MESES[(p % 100) - 1]} ${Math.floor(p / 100)}` : '—');

/** 202611 → '2026-11' (valor de <input type="month">) */
export const periodoInput = (p) => (p ? `${Math.floor(p / 100)}-${String(p % 100).padStart(2, '0')}` : '');

/** Hoy en formato 'AAAA-MM-DD' (hora local). */
export function hoyIso() {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`;
}

/** Suma días a 'AAAA-MM-DD'. */
export function sumarDias(iso, dias) {
  const [a, m, d] = iso.split('-').map(Number);
  const f = new Date(a, m - 1, d + dias);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
}

/** Fin de un contrato de N meses que inicia en `iso` (fin inclusivo): 01/12 + 6 meses → 31/05. */
export function finPorMeses(iso, meses) {
  const [a, m, d] = iso.split('-').map(Number);
  const f = new Date(a, m - 1 + meses, d - 1);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
}

/** Duración igual a la que calcula el SP: meses completos y días sobrantes (fin inclusivo). */
export function duracion(inicio, fin) {
  if (!inicio || !fin || fin <= inicio) return null;
  const fin1 = sumarDias(fin, 1);
  const [a1, m1] = inicio.split('-').map(Number);
  const [a2, m2] = fin1.split('-').map(Number);
  let meses = (a2 - a1) * 12 + (m2 - m1);
  if (finPorMeses(inicio, meses) >= fin1) meses -= 1;
  const desde = sumarDias(finPorMeses(inicio, meses), 1);
  const dias = Math.round((new Date(fin1) - new Date(desde)) / 86400000);
  return { meses, dias };
}

export const textoDuracion = (d) =>
  d ? `${d.meses} ${d.meses === 1 ? 'mes' : 'meses'}${d.dias > 0 ? ` y ${d.dias} ${d.dias === 1 ? 'día' : 'días'}` : ''}` : '—';

/** Nombre "APELLIDOS, NOMBRES" en mayúsculas → "Apellidos, Nombres". */
export function nombrePersona(texto) {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .replace(/(^|[\s,'-])(\p{L})/gu, (_, sep, letra) => sep + letra.toUpperCase());
}

export const iniciales = (texto) =>
  (texto ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
