import { api, empresasParam } from '../client';

/**
 * GET /inicio/resumen  →  SP_RRHH_INICIO_RESUMEN
 * @returns {{ totales: object, empresas: object[] }}
 */
export const getInicioResumen = (empresas, dias = 30) =>
  api.get('inicio/resumen', { params: { ...empresasParam(empresas), dias } }).then((r) => r.data.data);
