/** PLA_PERSONAL.TIP_ESTADO */
export const ESTADOS_PERSONAL = {
  AC: { texto: 'Activo', clase: 'badge-ok' },
  CE: { texto: 'Cesado', clase: 'badge-neutro' },
  IN: { texto: 'Inactivo', clase: 'badge-neutro' },
};

export const SEXOS = { MA: 'Masculino', FE: 'Femenino' };
export const ESTADOS_CIVILES = { SO: 'Soltero(a)', CA: 'Casado(a)', CO: 'Conviviente', DI: 'Divorciado(a)', VU: 'Viudo(a)' };

/** Estado de la persona (viaja como ?estado=). */
export const ESTADOS_LISTA = [
  { valor: 'ACTIVO', texto: 'Activos', conteo: 'activo' },
  { valor: 'CESADO', texto: 'Cesados', conteo: 'cesado' },
  { valor: 'TODOS', texto: 'Todos', conteo: 'todos' },
];

/** Filtros de revisión (viajan como ?filtro=); solo cuentan personas activas. */
export const FILTROS = [
  { valor: '', texto: 'Sin filtro' },
  { valor: 'VARIAS_EMPRESAS', texto: 'En varias empresas', conteo: 'varias_empresas' },
  { valor: 'SIN_USUARIO', texto: 'Sin usuario intranet', conteo: 'sin_usuario' },
  { valor: 'SIN_JEFE', texto: 'Sin jefe', conteo: 'sin_jefe' },
  { valor: 'SIN_CONTRATO', texto: 'Sin contrato', conteo: 'sin_contrato' },
  { valor: 'POR_VENCER', texto: 'Contrato por vencer', conteo: 'por_vencer' },
];

/**
 * Objeto que entiende <Semaforo> a partir de la situación del contrato en
 * proceso de un vínculo (SP_RRHH_PERSONAL_BASE). null si no aplica.
 */
export function contratoEnProceso(v) {
  if (!v?.situacion_contrato || v.situacion_contrato === 'SIN_CONTRATO') return null;
  return { estado: 'P', situacion: v.situacion_contrato, dias_restantes: v.dias_restantes };
}

/** 2299 días → "6 años 3 meses" */
export function tiempoServicio(dias) {
  if (dias === null || dias === undefined || dias < 0) return '—';
  const anios = Math.floor(dias / 365.25);
  const meses = Math.floor((dias - anios * 365.25) / 30.44);
  const partes = [];
  if (anios) partes.push(`${anios} ${anios === 1 ? 'año' : 'años'}`);
  if (meses || !anios) partes.push(`${meses} ${meses === 1 ? 'mes' : 'meses'}`);
  return partes.join(' ');
}

/** Ruta de la ficha 360° de un vínculo. */
export const rutaFicha = (empresa, codPersonal) => `/personal/${encodeURIComponent(empresa)}/${encodeURIComponent(codPersonal)}`;
