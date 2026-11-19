import { api, descargarArchivo, empresasParam } from '../client';

/** Quién abrió su boleta, cuándo y desde dónde (paginado). */
export const getVisualizaciones = (empresas, filtros) =>
  api.get('boletas/visualizaciones', { params: { ...empresasParam(empresas), ...filtros } }).then((r) => r.data);

/** Por empresa y período: visualizaciones, trabajadores distintos, conformes. */
export const getVisualizacionesResumen = (empresas, filtros) =>
  api.get('boletas/visualizaciones/resumen', { params: { ...empresasParam(empresas), ...filtros } }).then((r) => r.data.data);

export const exportarVisualizaciones = (empresas, filtros) =>
  descargarArchivo('boletas/visualizaciones/export', { ...empresasParam(empresas), ...filtros });
