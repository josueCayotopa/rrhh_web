/** ESTADO_DOC que calcula SP_RRHH_LEGAJO_DETALLE para cada tipo de documento. */
export const ESTADOS_DOC = {
  PENDIENTE: { texto: 'Pendiente', clase: 'badge-neutro' },
  VIGENTE: { texto: 'Vigente', clase: 'badge-ok' },
  POR_VENCER: { texto: 'Por vencer', clase: 'badge-aviso' },
  VENCIDO: { texto: 'Vencido', clase: 'badge-error' },
};

/** Debe coincidir con config('rrhh.legajos.extensiones') y tamano_maximo_mb. */
export const EXTENSIONES = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
export const TAMANO_MAX_MB = 30;

export const ESTADOS_PERSONAL = [
  { valor: 'AC', texto: 'Activos' },
  { valor: 'CE', texto: 'Cesados' },
  { valor: '', texto: 'Todos' },
];

export function tamano(bytes) {
  const n = Number(bytes);
  if (!n) return '';
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
