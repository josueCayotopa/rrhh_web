/**
 * Situación de un contrato: la calcula SP_RRHH_CONTRATOS_BASE (no se guarda).
 * texto = etiqueta en pantalla · clase = color del badge.
 */
export const SITUACIONES = {
  VIGENTE: { texto: 'Vigente', clase: 'badge-ok' },
  POR_VENCER: { texto: 'Por vencer', clase: 'badge-aviso' },
  VENCIDO_SIN_CERRAR: { texto: 'Vencido sin cerrar', clase: 'badge-error' },
  INDETERMINADO: { texto: 'Indeterminado', clase: 'badge-ok' },
  VENCIDO: { texto: 'Vencido', clase: 'badge-neutro' },
  ANULADO: { texto: 'Anulado', clase: 'badge-neutro' },
  CESADO: { texto: 'Cesado', clase: 'badge-neutro' },
  SIN_ESTADO: { texto: 'Sin estado', clase: 'badge-neutro' },
};

/** Pestañas de la lista (el valor viaja como ?situacion=). '' = todos. */
export const PESTANAS = [
  { valor: 'EN_PROCESO', texto: 'En proceso', conteo: 'en_proceso' },
  { valor: 'POR_VENCER', texto: 'Por vencer', conteo: 'por_vencer' },
  { valor: 'VENCIDO_SIN_CERRAR', texto: 'Vencidos sin cerrar', conteo: 'vencido_sin_cerrar' },
  { valor: 'POR_EVALUAR', texto: 'Por evaluar', conteo: 'por_evaluar' },
  { valor: 'INDETERMINADO', texto: 'Indeterminados', conteo: 'indeterminado' },
  { valor: 'VENCIDO', texto: 'Vencidos', conteo: 'vencido' },
  { valor: 'ANULADO', texto: 'Anulados', conteo: 'anulado' },
  { valor: 'CESADO', texto: 'Cesados', conteo: 'cesado' },
  { valor: '', texto: 'Todos', conteo: 'todos' },
];

/** IND_CONTRATO */
export const INDICADOR = { I: 'Inicial', R: 'Renovación', A: 'Adenda' };

/** Tope legal de contratos sujetos a modalidad (D.S. 003-97-TR, art. 74): 5 años. */
export const TOPE_MODAL_DIAS = 5 * 365;

/** Duraciones rápidas del formulario (meses). */
export const DURACIONES = [1, 2, 3, 6, 12];

/** Campos del convenio de prácticas pre profesionales (tipo PP). */
export const CAMPOS_PRACTICA = [
  { campo: 'pra_cfp_razon_social', etiqueta: 'Centro de formación (razón social)', max: 150, obligatorio: true },
  { campo: 'pra_cfp_ruc', etiqueta: 'RUC del centro', max: 11, obligatorio: true },
  { campo: 'pra_cfp_domicilio', etiqueta: 'Domicilio del centro', max: 250, obligatorio: true },
  { campo: 'pra_cfp_representante', etiqueta: 'Representante', max: 150, obligatorio: true },
  { campo: 'pra_cfp_cargo_repres', etiqueta: 'Cargo del representante', max: 100, obligatorio: false },
  { campo: 'pra_cfp_dni_repres', etiqueta: 'DNI del representante', max: 15, obligatorio: true },
  { campo: 'pra_situacion', etiqueta: 'Situación académica', max: 50, obligatorio: true },
  { campo: 'pra_especialidad', etiqueta: 'Especialidad', max: 100, obligatorio: true },
  { campo: 'pra_ocupacion', etiqueta: 'Ocupación en la empresa', max: 100, obligatorio: true },
  { campo: 'pra_dias', etiqueta: 'Días de prácticas', max: 100, obligatorio: true },
  { campo: 'pra_lugar', etiqueta: 'Lugar de prácticas', max: 250, obligatorio: false },
];

/** Texto y color de la columna "Vencimiento". */
export function textoVencimiento(c) {
  switch (c.situacion) {
    case 'ANULADO':
      return { texto: 'Sin efecto', color: 'text-gris' };
    case 'CESADO':
      return { texto: 'Cesó', color: 'text-gris' };
    case 'INDETERMINADO':
      return { texto: 'Plazo indeterminado', color: 'text-ok' };
    case 'VENCIDO':
    case 'SIN_ESTADO':
      return { texto: 'Cerrado', color: 'text-gris' };
    default:
      break;
  }
  const d = c.dias_restantes;
  if (d === null || d === undefined) return { texto: '—', color: 'text-gris' };
  if (d < 0) return { texto: `Venció hace ${-d} ${d === -1 ? 'día' : 'días'}`, color: 'text-rojo-texto' };
  if (d === 0) return { texto: 'Vence hoy', color: 'text-rojo-texto' };
  return { texto: `Vence en ${d} ${d === 1 ? 'día' : 'días'}`, color: d <= 30 ? 'text-aviso' : 'text-ok' };
}

/**
 * Semáforo del contrato en proceso:
 *   verde = vigente (vence en más de 30 días) o indeterminado
 *   ámbar = vence en 8 a 30 días
 *   rojo  = vence en 7 días o menos, o ya venció sin cerrarse
 * Los contratos cerrados (vencido, anulado, cesado) van apagados.
 */
export function semaforo(c) {
  if (c.estado !== 'P') return { luz: null, texto: SITUACIONES[c.situacion]?.texto ?? 'Sin estado' };
  if (c.situacion === 'INDETERMINADO') return { luz: 'verde', texto: 'Indeterminado' };
  if (c.situacion === 'VENCIDO_SIN_CERRAR') return { luz: 'rojo', texto: 'Vencido sin cerrar' };
  if (c.situacion === 'POR_VENCER') {
    return c.dias_restantes <= 7 ? { luz: 'rojo', texto: 'Vence pronto' } : { luz: 'ambar', texto: 'Por vencer' };
  }
  return { luz: 'verde', texto: 'Vigente' };
}

export const claveContrato =(c) => `${c.empresa}|${c.cod_personal}|${c.cod_contrato}`;
