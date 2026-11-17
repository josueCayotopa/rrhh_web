const PATHS = {
  inicio: <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>,
  personal: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 5.2a3.5 3.5 0 0 1 0 5.6M18 20a6.5 6.5 0 0 0-2.5-5" /></>,
  estructura: <><rect x="9" y="3" width="6" height="5" rx="1" /><rect x="3" y="16" width="6" height="5" rx="1" /><rect x="15" y="16" width="6" height="5" rx="1" /><path d="M12 8v4M6 16v-4h12v4" /></>,
  ficha: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  contratos: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>,
  evaluacion: <><path d="M9 11l3 3 8-8" /><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9" /></>,
  solicitudes: <><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></>,
  vacaciones: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
  permisos: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  legajo: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  boletas: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></>,
  buscar: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>,
  salir: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></>,
  alerta: <><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17v.5" /></>,
  recargar: <><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></>,
  cerrar: <path d="M6 6l12 12M18 6 6 18" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  panel: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></>,
  empresa: <><path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" /><path d="M16 9h2a2 2 0 0 1 2 2v10M3 21h18M8 7h4M8 11h4M8 15h4" /></>,
  abajo: <path d="M6 9l6 6 6-6" />,
  check: <path d="M5 12l5 5L20 7" />,
  mas: <path d="M12 5v14M5 12h14" />,
  editar: <><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M14 6l4 4" /></>,
  flecha: <path d="M9 6l6 6-6 6" />,
  volver: <path d="M15 6l-6 6 6 6" />,
  renovar: <><path d="M4 12a8 8 0 0 1 14-5.3L20 9" /><path d="M20 4v5h-5" /><path d="M20 12a8 8 0 0 1-14 5.3L4 15" /><path d="M4 20v-5h5" /></>,
  cese: <><circle cx="12" cy="12" r="9" /><path d="M8 12h8" /></>,
  anular: <><circle cx="12" cy="12" r="9" /><path d="M6 6l12 12" /></>,
};

/** Íconos de trazo. Decorativos por defecto: el texto vecino da el nombre accesible. */
export default function Icon({ name, size = 20, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      {PATHS[name]}
    </svg>
  );
}
