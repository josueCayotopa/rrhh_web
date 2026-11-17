/**
 * Estado de una evaluación POR PERÍODO (lo calcula SP_RRHH_EVALUACIONES_BASE).
 * NUEVA = el período aún no existe (formulario en blanco).
 */
export const ESTADOS_EVALUACION = {
  NUEVA: { texto: 'Nueva', clase: 'badge-neutro' },
  EN_PROCESO: { texto: 'En evaluación', clase: 'badge-info' },
  PENDIENTE_APROBACION: { texto: 'Pendiente de aprobación', clase: 'badge-aviso' },
  APROBADA: { texto: 'Aprobada', clase: 'badge-ok' },
  CERRADA: { texto: 'Cerrada', clase: 'badge-ok' },
  RECHAZADA: { texto: 'Rechazada', clase: 'badge-error' },
  CONTRATO_GENERADO: { texto: 'Contrato generado', clase: 'badge-neutro' },
};

export const PESTANAS = [
  { valor: '', texto: 'Todas', conteo: 'todos' },
  { valor: 'EN_PROCESO', texto: 'En evaluación', conteo: 'en_proceso' },
  { valor: 'PENDIENTE_APROBACION', texto: 'Pendientes de aprobación', conteo: 'pendiente_aprobacion' },
  { valor: 'POR_RENOVAR', texto: 'Por renovar', conteo: 'por_renovar' },
  { valor: 'APROBADA', texto: 'Aprobadas', conteo: 'aprobada' },
  { valor: 'CERRADA', texto: 'Cerradas', conteo: 'cerrada' },
  { valor: 'RECHAZADA', texto: 'Rechazadas', conteo: 'rechazada' },
  { valor: 'CONTRATO_GENERADO', texto: 'Con contrato generado', conteo: 'contrato_generado' },
];

/** Recomendación final (PLA_PERSONAL_EVALUADO.RECOMENDACION_FINAL). */
export const RECOMENDACIONES = [
  { valor: '12M', texto: '12 meses', detalle: 'Renovar', meses: 12 },
  { valor: '6M', texto: '6 meses', detalle: 'Renovar', meses: 6 },
  { valor: '3M', texto: '3 meses', detalle: 'Renovar', meses: 3 },
  { valor: '2M', texto: '2 meses', detalle: 'Renovar', meses: 2 },
  { valor: '1M', texto: '1 mes', detalle: 'Renovar', meses: 1 },
  { valor: 'IN', texto: 'Indeterminado', detalle: 'Contrato sin plazo', meses: null },
  { valor: 'NO', texto: 'No renovar', detalle: 'Justificación obligatoria', meses: null },
];

export const textoRecomendacion = (v) => RECOMENDACIONES.find((r) => r.valor === v)?.texto ?? '—';

/** Sección de criterios (PLA_CRITERIOS_EVALUACION.CATEGORIA). */
export const SECCIONES = {
  RH: { titulo: 'Validación de Recursos Humanos', corto: 'RR.HH.' },
  JEFE: { titulo: 'Evaluación del jefe inmediato', corto: 'Jefe' },
};

/** Tipos de contrato que guarda la cabecera de evaluación (texto, como hoy). */
export const TIPOS_CONTRATO_EVAL = [
  'A MODALIDAD', 'JUVENIL', 'PRE PROFESIONAL', 'LOCACION DE SERVICIO', 'SUPLENCIA', 'TIEMPO PARCIAL', 'SERVICIOS PROFESIONALES',
];
