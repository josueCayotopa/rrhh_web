import { abrirPdf, api, empresasParam } from '../client';

const datos = (r) => r.data.data;

/** Bandeja paginada; meta.conteos por etapa. */
export const getPermisos = (empresas, filtros) =>
  api.get('permisos', { params: { ...empresasParam(empresas), ...filtros } }).then((r) => r.data);

/** → { totales, empresas, por_motivo, por_mes } */
export const getPermisosResumen = (empresas) =>
  api.get('permisos/resumen', { params: empresasParam(empresas) }).then(datos);

/** Catálogo del formulario de una empresa → { motivos, documentos, tipos_documento } */
export const getMotivosPermiso = (empresa) => api.get(`permisos/${empresa}/motivos`).then(datos);

/** → { solicitud, documentos, requeridos } */
export const getPermiso = (empresa, id) => api.get(`permisos/${empresa}/${id}`).then(datos);

export const verDocumentoPermiso = (empresa, doc) => abrirPdf(`permisos/${empresa}/documentos/${doc}`);

/** RR.HH. registra por el trabajador (multipart). */
export const registrarPermiso = (formData) => api.post('permisos', formData).then((r) => r.data);

export const adjuntarDocumentoPermiso = (empresa, id, formData) => api.post(`permisos/${empresa}/${id}/documentos`, formData).then((r) => r.data);
export const quitarDocumentoPermiso = (empresa, doc) => api.delete(`permisos/${empresa}/documentos/${doc}`).then((r) => r.data);

/** accion: aprobar | rechazar | cancelar */
export const resolverPermiso = (empresa, id, accion, obs) => api.post(`permisos/${empresa}/${id}/${accion}`, { obs }).then((r) => r.data);
