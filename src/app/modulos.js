/**
 * Mapa de módulos: alimenta el menú lateral y las tarjetas de la página de inicio.
 * estado: 'listo' (pantalla construida) · 'api' (API lista, falta pantalla) · 'pendiente'
 * indicador: campo de `totales` de /inicio/resumen que se muestra como contador.
 */
export const GRUPOS = [
  {
    nombre: 'Organización',
    modulos: [
      { clave: 'personal', nombre: 'Personal', ruta: '/personal', icono: 'personal', estado: 'listo', descripcion: 'Lista única por persona, código en cada empresa y ficha 360°.' },
      { clave: 'estructura', nombre: 'Estructura organizacional', ruta: '/estructura', icono: 'estructura', estado: 'listo', descripcion: 'Empresa › sede › área › cargo, jefes y asignación de evaluaciones.' },
    ],
  },
  {
    nombre: 'Contratación',
    modulos: [
      { clave: 'contratos', nombre: 'Contratos', ruta: '/contratos', icono: 'contratos', estado: 'listo', descripcion: 'Registro, renovación, cese y vencimientos.', indicador: 'contratos_por_vencer' },
      { clave: 'evaluaciones', nombre: 'Evaluación de desempeño', ruta: '/evaluaciones', icono: 'evaluacion', estado: 'listo', descripcion: 'Calificación RR.HH. y jefe, aprobaciones y renovación.' },
    ],
  },
  {
    nombre: 'Tiempo y ausencias',
    modulos: [
      { clave: 'solicitudes', nombre: 'Solicitudes de vacaciones', ruta: '/vacaciones/solicitudes', icono: 'solicitudes', estado: 'listo', descripcion: 'Lo que el personal pide desde la intranet.', indicador: 'sol_pendientes' },
      { clave: 'vacaciones', nombre: 'Vacaciones del personal', ruta: '/vacaciones/personal', icono: 'vacaciones', estado: 'listo', descripcion: 'Saldos, historial de goce y compra, registro en planilla.' },
      { clave: 'permisos', nombre: 'Permisos', ruta: '/permisos', icono: 'permisos', estado: 'listo', descripcion: 'Formato de autorización: trabajador, jefe y RR.HH.' },
    ],
  },
  {
    nombre: 'Documentos',
    modulos: [
      { clave: 'legajos', nombre: 'Legajo digital', ruta: '/legajos', icono: 'legajo', estado: 'listo', descripcion: 'Documentos del trabajador, versiones y vencimientos.', indicador: 'legajos_por_vencer' },
      { clave: 'boletas', nombre: 'Visualización de boletas', ruta: '/boletas', icono: 'boletas', estado: 'listo', descripcion: 'Quién abrió su boleta y cuándo.' },
    ],
  },
];

export const ESTADOS = {
  listo: { texto: 'Disponible', clase: 'badge-ok' },
  api: { texto: 'API lista · falta pantalla', clase: 'badge-info' },
  pendiente: { texto: 'En construcción', clase: 'badge-neutro' },
};

export const MODULOS = GRUPOS.flatMap((grupo) => grupo.modulos);

/** Solicitudes que RR.HH. puede atender: las pendientes de jefe y las ya aprobadas por el jefe. */
export const solPendientes = (fila) =>
  fila.sol_pendientes_jefe === null ? null : fila.sol_pendientes_jefe + fila.sol_pendientes_rrhh;
