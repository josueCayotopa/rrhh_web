import { abrirPdf, api, descargarArchivo, empresasParam } from '../client';

const datos = (r) => r.data.data;

/** Lista paginada (un trabajador por empresa) con avance de documentos requeridos. */
export const getLegajos = (empresas, filtros) =>
  api.get('legajos', { params: { ...empresasParam(empresas), ...filtros } }).then((r) => r.data);

/** Documentos que vencen en los próximos días (y vencidos si incluir_vencidos=1). */
export const getLegajosPorVencer = (empresas, filtros) =>
  api.get('legajos/por-vencer', { params: { ...empresasParam(empresas), ...filtros } }).then((r) => r.data);

/** → { trabajador, documentos (checklist por tipo), resumen } */
export const getLegajo = (empresa, codPersonal) =>
  api.get(`legajos/${empresa}/${codPersonal}`).then(datos);

export const getHistorialDoc = (empresa, codPersonal, codTipoDoc) =>
  api.get(`legajos/${empresa}/${codPersonal}/historial/${codTipoDoc}`).then(datos);

export const getTiposPlanilla = () => api.get('catalogos/tipos-planilla').then(datos);

/** multipart: cod_tipo_doc, archivo, fec_vencimiento?, obs_documento? */
export const cargarDocumento = (empresa, codPersonal, campos) => {
  const fd = new FormData();
  Object.entries(campos).forEach(([k, v]) => { if (v !== null && v !== undefined && v !== '') fd.append(k, v); });
  return api.post(`legajos/${empresa}/${codPersonal}/documentos`, fd).then((r) => r.data);
};

export const bajaDocumento = (empresa, codLegajo, motivo) =>
  api.delete(`legajos/${empresa}/documentos/${encodeURIComponent(codLegajo)}`, { data: { motivo } }).then((r) => r.data);

export const verDocumento = (empresa, codLegajo) => abrirPdf(`legajos/${empresa}/documentos/${encodeURIComponent(codLegajo)}/ver`);
export const descargarDocumento = (empresa, codLegajo, nombre) =>
  descargarArchivo(`legajos/${empresa}/documentos/${encodeURIComponent(codLegajo)}/descargar`, undefined, nombre);

export const exportarLegajos = (empresas, filtros) =>
  descargarArchivo('legajos/export', { ...empresasParam(empresas), ...filtros });
