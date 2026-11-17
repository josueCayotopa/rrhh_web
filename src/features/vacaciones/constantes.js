import { sumarDias } from '../../lib/format';

/** Etapa de una solicitud (calculada en SP_RRHH_SOL_VAC_BASE). */
export const ETAPAS = {
  PENDIENTE_JEFE: { texto: 'Pendiente del jefe', clase: 'badge-aviso' },
  PENDIENTE_RRHH: { texto: 'Pendiente de RR.HH.', clase: 'badge-info' },
  POR_PLANILLA: { texto: 'Aprobada · por registrar', clase: 'badge-ok' },
  EN_PLANILLA: { texto: 'En planilla', clase: 'badge-neutro' },
  RECHAZADA: { texto: 'Rechazada', clase: 'badge-error' },
  CANCELADA: { texto: 'Cancelada', clase: 'badge-neutro' },
  OTRO: { texto: 'Otro', clase: 'badge-neutro' },
};

export const PESTANAS_SOL = [
  { valor: 'POR_ATENDER', texto: 'Por atender', conteo: 'por_atender' },
  { valor: 'PENDIENTE_JEFE', texto: 'Pendientes del jefe', conteo: 'pendiente_jefe' },
  { valor: 'PENDIENTE_RRHH', texto: 'Pendientes de RR.HH.', conteo: 'pendiente_rrhh' },
  { valor: 'POR_PLANILLA', texto: 'Por registrar en planilla', conteo: 'por_planilla' },
  { valor: 'EN_PLANILLA', texto: 'En planilla', conteo: 'en_planilla' },
  { valor: 'RECHAZADA', texto: 'Rechazadas', conteo: 'rechazada' },
  { valor: 'CANCELADA', texto: 'Canceladas', conteo: 'cancelada' },
  { valor: '', texto: 'Todas', conteo: 'todos' },
];

/** Tipos de vacaciones (TIP_VACACIONES). */
export const TIPOS = {
  VG: { texto: 'Goce', largo: 'Vacaciones gozadas', clase: 'badge-info' },
  VC: { texto: 'Compra', largo: 'Compra de vacaciones', clase: 'badge-aviso' },
  VN: { texto: 'Normal', largo: 'Vacaciones normales', clase: 'badge-neutro' },
  VA: { texto: 'Adelanto', largo: 'Adelanto de vacaciones', clase: 'badge-neutro' },
};

export const FILTROS_PERSONAL = [
  { valor: '', texto: 'Todos', conteo: 'todos' },
  { valor: 'ACUMULADAS', texto: 'Saldo ≥ 30 días', conteo: 'acumuladas' },
  { valor: 'DOBLE_PERIODO', texto: 'Saldo ≥ 60 días', conteo: 'doble_periodo' },
  { valor: 'SALDO_NEGATIVO', texto: 'Saldo negativo', conteo: 'saldo_negativo' },
  { valor: 'CON_SOLICITUD', texto: 'Con solicitud en curso', conteo: 'con_solicitud' },
  { valor: 'HABILITADOS', texto: 'Habilitados en la intranet', conteo: 'habilitados' },
  { valor: 'SIN_PROCESOS', texto: 'Sin vacaciones registradas', conteo: 'sin_procesos' },
  { valor: 'VARIAS_EMPRESAS', texto: 'En varias empresas', conteo: 'varias_empresas' },
];

export const MONEDAS = [
  { valor: '01', texto: 'Soles (S/)' },
  { valor: '02', texto: 'Dólares ($)' },
];

export const claveSolicitud = (s) => `${s.empresa}|${s.cod_personal}|${s.cod_corr_sol}`;

/** '2025-2026' → { per_desde: 2025, per_hasta: 2026 } */
export function periodoAnios(texto) {
  const m = /^(\d{4})-(\d{4})$/.exec(texto ?? '');
  return m ? { per_desde: Number(m[1]), per_hasta: Number(m[2]) } : { per_desde: '', per_hasta: '' };
}

/**
 * Divide un rango en un tramo por mes calendario (igual que "pasar a planilla"
 * de la web actual). El adelanto de la compra va completo en el primer tramo.
 */
export function tramosPorMes(inicio, fin, tipo, impAdelanto, periodoVac) {
  const tramos = [];
  const per = periodoAnios(periodoVac);
  let cursor = inicio;
  let primero = true;
  while (cursor && fin && cursor <= fin) {
    const [a, m] = cursor.split('-').map(Number);
    const finMes = `${a}-${String(m).padStart(2, '0')}-${String(new Date(a, m, 0).getDate()).padStart(2, '0')}`;
    const finTramo = finMes < fin ? finMes : fin;
    tramos.push({
      fec_inicio: cursor,
      fec_final: finTramo,
      tip_vacaciones: tipo || 'VN',
      ...per,
      ano_aplica: a,
      mes_aplica: m,
      imp_adelanto_vacac: primero && impAdelanto ? impAdelanto : '',
    });
    cursor = sumarDias(finTramo, 1);
    primero = false;
  }
  return tramos;
}

/** Días de un tramo (inclusivo). */
export const diasEntre = (ini, fin) => (ini && fin && fin >= ini ? Math.round((new Date(fin) - new Date(ini)) / 86400000) + 1 : 0);
