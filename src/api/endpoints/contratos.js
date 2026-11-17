import { abrirPdf, api, empresasParam } from '../client';

const datos = (r) => r.data.data;

/** GET /contratos → { data: filas, meta: { total, conteos, … } } (SP_RRHH_CONTRATOS_LISTAR) */
export const getContratos = (empresas, filtros) =>
  api.get('contratos', { params: { ...empresasParam(empresas), ...filtros } }).then((r) => r.data);

/** GET /contratos/resumen → { totales, empresas, por_mes } */
export const getContratosResumen = (empresas, dias = 30) =>
  api.get('contratos/resumen', { params: { ...empresasParam(empresas), dias } }).then(datos);

/** GET /contratos/{empresa}/{codPersonal}/{codContrato} → { contrato, historial, evaluaciones } */
export const getContrato = ({ empresa, cod_personal, cod_contrato }) =>
  api.get(`contratos/${empresa}/${cod_personal}/${cod_contrato}`).then(datos);

/** GET /contratos/personal-disponible — personal activo sin contratos */
export const getPersonalDisponible = (empresa, q) =>
  api.get('contratos/personal-disponible', { params: { empresa, q } }).then(datos);

export const getTiposContrato = (empresas) =>
  api.get('catalogos/tipos-contrato', { params: empresasParam(empresas) }).then(datos);

const ruta = (c) => `contratos/${c.empresa}/${c.cod_personal}/${c.cod_contrato}`;

export const crearContrato = (cuerpo) => api.post('contratos', cuerpo).then((r) => r.data);
export const renovarContrato = (contrato, cuerpo) => api.post(`${ruta(contrato)}/renovar`, cuerpo).then((r) => r.data);
export const editarContrato = (contrato, cuerpo) => api.put(ruta(contrato), cuerpo).then((r) => r.data);
export const anularContrato = (contrato) => api.post(`${ruta(contrato)}/anular`).then((r) => r.data);
/** Contrato para imprimir (solo en proceso), con el formato de la web actual. */
export const imprimirContrato = (contrato) => abrirPdf(`${ruta(contrato)}/pdf`);

/** Contrato firmado y escaneado (PDF). */
export const verContratoFirmado = (contrato) => abrirPdf(`${ruta(contrato)}/archivo`);
export const subirContratoFirmado = (contrato, archivo) => {
  const datos = new FormData();
  datos.append('archivo', archivo);
  return api.post(`${ruta(contrato)}/archivo`, datos).then((r) => r.data);
};

export const cesarTrabajador =(contrato, fecha_cese) =>
  api.post(`contratos/${contrato.empresa}/${contrato.cod_personal}/cesar`, { fecha_cese }).then((r) => r.data);
