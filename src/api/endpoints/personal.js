import { api, empresasParam } from '../client';

const datos = (r) => r.data.data;

/** Lista única: una fila por persona (DNI) con empresas_detalle; meta.conteos para pestañas. */
export const getPersonal = (empresas, filtros) =>
  api.get('personal', { params: { ...empresasParam(empresas), ...filtros } }).then((r) => r.data);

/** → { totales, personas, empresas, movimientos, planillas } */
export const getPersonalResumen = (empresas) =>
  api.get('personal/resumen', { params: empresasParam(empresas) }).then(datos);

/** Ficha 360° → { persona, vinculos, contratos, evaluaciones, vacaciones } */
export const getFichaPersonal = (empresas, empresa, codPersonal) =>
  api.get(`personal/${empresa}/${codPersonal}`, { params: empresasParam(empresas) }).then(datos);
