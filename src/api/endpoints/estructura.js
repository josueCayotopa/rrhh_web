import { api, empresasParam } from '../client';

/** GET /estructura/resumen → una fila por empresa/sede/área/cargo (SP_RRHH_ESTRUCTURA_RESUMEN) */
export const getEstructura = (empresas) =>
  api.get('estructura/resumen', { params: empresasParam(empresas) }).then((r) => r.data.data);

/** GET /estructura/personal → { data, meta } personal del nodo (SP_RRHH_ESTRUCTURA_PERSONAL) */
export const getPersonalNodo = (empresas, filtros) =>
  api.get('estructura/personal', { params: { ...empresasParam(empresas), ...filtros } }).then((r) => r.data);

/** POST /evaluaciones/asignar → resultado por trabajador (SP_RRHH_EVALUACIONES_ASIGNAR) */
export const asignarEvaluaciones = (cuerpo) => api.post('evaluaciones/asignar', cuerpo).then((r) => r.data);
