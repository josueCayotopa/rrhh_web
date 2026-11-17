import { api, empresasParam } from '../client';

const datos = (r) => r.data.data;

// ── Solicitudes de la intranet (goce VG / compra VC) ──────────────────────
export const getSolicitudesVac = (empresas, filtros) =>
  api.get('vacaciones/solicitudes', { params: { ...empresasParam(empresas), ...filtros } }).then((r) => r.data);

export const getSolicitudesVacResumen = (empresas) =>
  api.get('vacaciones/solicitudes/resumen', { params: empresasParam(empresas) }).then(datos);

/** → { solicitud, saldo, otras, procesos } */
export const getSolicitudVac = ({ empresa, cod_personal, cod_corr_sol }) =>
  api.get(`vacaciones/solicitudes/${empresa}/${cod_personal}/${cod_corr_sol}`).then(datos);

/** accion: aprobar | rechazar | cancelar */
export const resolverSolicitudVac = (s, accion, cuerpo = {}) =>
  api.post(`vacaciones/solicitudes/${s.empresa}/${s.cod_personal}/${s.cod_corr_sol}/${accion}`, cuerpo).then((r) => r.data);

// ── Vacaciones del personal ───────────────────────────────────────────────
export const getVacacionesPersonal = (empresas, filtros) =>
  api.get('vacaciones/personal', { params: { ...empresasParam(empresas), ...filtros } }).then((r) => r.data);

export const getVacacionesResumen = (empresas) =>
  api.get('vacaciones/personal/resumen', { params: empresasParam(empresas) }).then(datos);

/** → { saldo, procesos, tramos, solicitudes } */
export const getVacacionesTrabajador = (empresa, codPersonal) =>
  api.get(`vacaciones/personal/${empresa}/${codPersonal}`).then(datos);

/** Registra en planilla (cabecera + tramos). Con cod_corr_sol: desde una solicitud aprobada. */
export const registrarVacaciones = (empresa, codPersonal, cuerpo) =>
  api.post(`vacaciones/personal/${empresa}/${codPersonal}/procesos`, cuerpo).then((r) => r.data);

export const guardarConfigVacaciones = (empresa, codPersonal, cuerpo) =>
  api.put(`vacaciones/personal/${empresa}/${codPersonal}/config`, cuerpo).then((r) => r.data);
