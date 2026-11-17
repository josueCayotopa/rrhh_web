import { abrirPdf, api, empresasParam } from '../client';

/** Evaluación impresa, con el formato de la web actual. */
export const imprimirEvaluacion = (empresa, codPersonal, periodo) =>
  abrirPdf(`evaluaciones/${empresa}/${codPersonal}/${periodo}/pdf`);

const datos = (r) => r.data.data;

/** GET /evaluaciones → { data, meta: { conteos, … } } (SP_RRHH_EVALUACIONES_LISTAR) */
export const getEvaluaciones = (empresas, filtros) =>
  api.get('evaluaciones', { params: { ...empresasParam(empresas), ...filtros } }).then((r) => r.data);

/** GET /evaluaciones/resumen → { totales, empresas } */
export const getEvaluacionesResumen = (empresas, dias = 30) =>
  api.get('evaluaciones/resumen', { params: { ...empresasParam(empresas), dias } }).then(datos);

/** GET /evaluaciones/{empresa}/{codPersonal}?periodo= → { cabecera, criterios, aprobaciones, periodos, contratos } */
export const getEvaluacion = (empresa, codPersonal, periodo) =>
  api.get(`evaluaciones/${empresa}/${codPersonal}`, { params: periodo ? { periodo } : {} }).then(datos);

/** Jefes y aprobadores posibles (tabla users de la empresa). */
export const getUsuariosEvaluacion = (empresa) => api.get(`evaluaciones/${empresa}/usuarios`).then(datos);

export const guardarEvaluacion = (empresa, codPersonal, periodo, cuerpo) =>
  api.put(`evaluaciones/${empresa}/${codPersonal}/${periodo}`, cuerpo).then((r) => r.data);

export const resolverAprobacion = (empresa, aprobacionId, cuerpo) =>
  api.post(`evaluaciones/${empresa}/aprobaciones/${aprobacionId}`, cuerpo).then((r) => r.data);

export const renovarDesdeEvaluacion = (empresa, codPersonal, periodo, cuerpo) =>
  api.post(`evaluaciones/${empresa}/${codPersonal}/${periodo}/renovar`, cuerpo).then((r) => r.data);

export const anularEvaluacion = (empresa, codPersonal, periodo) =>
  api.delete(`evaluaciones/${empresa}/${codPersonal}/${periodo}`).then((r) => r.data);
