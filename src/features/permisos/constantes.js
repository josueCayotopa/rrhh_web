/** Etapa de la solicitud (SP_RRHH_PERMISOS_BASE). */
export const ETAPAS = {
  PENDIENTE_JEFE: { texto: 'Espera al jefe', clase: 'badge-aviso' },
  PENDIENTE_RRHH: { texto: 'Por aprobar RR.HH.', clase: 'badge-info' },
  APROBADA: { texto: 'Aprobado', clase: 'badge-ok' },
  RECHAZADA: { texto: 'Rechazado', clase: 'badge-error' },
  CANCELADA: { texto: 'Cancelado', clase: 'badge-neutro' },
};

export const textoEtapa = (s) => (s.etapa === 'RECHAZADA' && s.rechazo_jefe ? 'Rechazado por el jefe' : ETAPAS[s.etapa]?.texto ?? s.etapa);

/** Pestañas (?etapa=). */
export const PESTANAS = [
  { valor: 'POR_ATENDER', texto: 'Por atender', conteo: 'por_atender' },
  { valor: 'PENDIENTE_RRHH', texto: 'Autorizados por el jefe', conteo: 'pendiente_rrhh' },
  { valor: 'PENDIENTE_JEFE', texto: 'Esperan al jefe', conteo: 'pendiente_jefe' },
  { valor: 'EN_CURSO', texto: 'En curso hoy', conteo: 'en_curso' },
  { valor: 'APROBADA', texto: 'Aprobados', conteo: 'aprobada' },
  { valor: 'RECHAZADA', texto: 'Rechazados', conteo: 'rechazada' },
  { valor: 'CANCELADA', texto: 'Cancelados', conteo: 'cancelada' },
  { valor: '', texto: 'Todos', conteo: 'todos' },
];

/** Tipos del formato (NUM_ORDEN; el ID cambia por empresa). */
export const MOTIVOS = [
  { valor: 1, texto: 'Descanso médico' },
  { valor: 2, texto: 'Licencia de paternidad' },
  { valor: 3, texto: 'Licencia de maternidad' },
  { valor: 4, texto: 'Cita médica' },
  { valor: 5, texto: 'Fallecimiento de familiar' },
  { valor: 6, texto: 'Sin goce de haber' },
  { valor: 7, texto: 'Citación judicial' },
  { valor: 8, texto: 'Otros' },
];

export const horario = (s) => (s.hora_inicio ? `${s.hora_inicio} a ${s.hora_fin}` : '');
export const claveSolicitud = (s) => `${s.empresa}|${s.id}`;
export const EXTENSIONES = '.pdf,.jpg,.jpeg,.png';
