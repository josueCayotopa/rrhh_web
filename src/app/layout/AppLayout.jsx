import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEmpresas } from '../../context/EmpresaContext';
import { GRUPOS } from '../modulos';
import Icon from '../../components/Icon';
import { iniciales, nombreEmpresa } from '../../lib/format';

const MENU_KEY = 'rrhh_menu_contraido';

function leerContraido() {
  try {
    return localStorage.getItem(MENU_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Ámbito de empresas en el encabezado: un botón que resume la elección y abre
 * un panel con las empresas (se muestra el NOMBRE; el código queda como ayuda).
 */
function SelectorEmpresas() {
  const { empresas, seleccionadas, todas, alternar, elegirTodas } = useEmpresas();
  const [abierto, setAbierto] = useState(false);
  const caja = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;
    const fuera = (e) => { if (caja.current && !caja.current.contains(e.target)) setAbierto(false); };
    const esc = (e) => { if (e.key === 'Escape') setAbierto(false); };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', fuera); document.removeEventListener('keydown', esc); };
  }, [abierto]);

  if (empresas.length <= 1) return null;

  const resumen = todas
    ? `Todas las empresas (${empresas.length})`
    : seleccionadas.length === 1
      ? nombreEmpresa(empresas.find((e) => e.empresa === seleccionadas[0])?.nombre)
      : `${seleccionadas.length} empresas`;

  return (
    <div ref={caja} className="relative">
      <button type="button" className="btn btn-sm max-w-[260px] gap-2" aria-expanded={abierto} aria-haspopup="true" onClick={() => setAbierto((v) => !v)}
        title="Empresas: aplica a todas las listas y tarjetas">
        <Icon name="empresa" size={16} className="text-rojo" />
        <span className="truncate">{resumen}</span>
        <Icon name="abajo" size={14} className={`transition-transform ${abierto ? 'rotate-180' : ''}`} />
      </button>
      {abierto && (
        <div className="glass absolute right-0 z-50 mt-2 w-[min(92vw,420px)] p-4" role="group" aria-label="Elegir empresas">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="label">Empresas</div>
              <div className="text-xs text-gris">Aplica a todas las listas y tarjetas</div>
            </div>
            <button type="button" className="chip" aria-pressed={todas} onClick={elegirTodas}>Todas</button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {empresas.map((e) => (
              <button key={e.empresa} type="button" className="chip" aria-pressed={seleccionadas.includes(e.empresa)}
                onClick={() => alternar(e.empresa)} title={`Código ${e.empresa}`}>
                {nombreEmpresa(e.nombre)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Encabezado fijo: menú, marca, empresas y cuenta. */
function Encabezado({ onMenu, contraido }) {
  const { usuario, empresas, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-linea bg-white/90 px-3 backdrop-blur-xl sm:px-4">
      <button type="button" className="btn btn-icon btn-sm" onClick={onMenu}
        aria-label={contraido ? 'Mostrar menú' : 'Ocultar menú'} title={contraido ? 'Mostrar menú' : 'Ocultar menú'}>
        <Icon name="menu" size={18} />
      </button>
      <NavLink to="/" className="flex shrink-0 items-center gap-2.5">
        <img src="/clinica_la_luz_isotipo.png" alt="" className="h-9 w-9 object-contain" />
        <span className="hidden leading-tight sm:block">
          <span className="block text-[15px] font-extrabold text-rojo-texto">Clínica La Luz</span>
          <span className="block text-[11px] font-semibold text-gris">Recursos Humanos · Grupo</span>
        </span>
      </NavLink>

      <div className="ml-auto flex min-w-0 items-center gap-2">
        <SelectorEmpresas />
        <div className="hidden items-center gap-2.5 pl-1 md:flex">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gris text-[13px] font-bold text-white">
            {iniciales(usuario?.nombre ?? usuario?.cod_usuario)}
          </span>
          <span className="max-w-[180px] leading-tight">
            <span className="block truncate text-[13px] font-bold">{usuario?.nombre ?? usuario?.cod_usuario}</span>
            <span className="block truncate text-[11px] font-medium text-gris">
              {usuario?.rol_nombre ?? usuario?.rol} · {empresas.length} {empresas.length === 1 ? 'empresa' : 'empresas'}
            </span>
          </span>
        </div>
        <button type="button" className="btn btn-icon btn-sm" onClick={logout} aria-label="Cerrar sesión" title="Cerrar sesión">
          <Icon name="salir" size={18} />
        </button>
      </div>
    </header>
  );
}

/** Enlaces del menú. `compacto` = solo íconos (el nombre queda como etiqueta accesible y tooltip). */
function Enlaces({ compacto, onNavegar }) {
  const clase = ({ isActive }) => `nav-link ${isActive ? 'active' : ''} ${compacto ? 'justify-center px-0!' : ''}`;

  return (
    <>
      <NavLink to="/" end className={clase} onClick={onNavegar} title={compacto ? 'Inicio' : undefined} aria-label={compacto ? 'Inicio' : undefined}>
        <Icon name="inicio" />
        {!compacto && <span className="flex-1">Inicio</span>}
      </NavLink>
      {GRUPOS.map((grupo) => (
        <div key={grupo.nombre} className="contents">
          {compacto
            ? <div className="mx-3 my-2 border-t border-linea" aria-hidden="true" />
            : <div className="label px-3.5 pt-4 pb-1.5">{grupo.nombre}</div>}
          {grupo.modulos.map((m) => (
            <NavLink key={m.clave} to={m.ruta} className={clase} onClick={onNavegar}
              title={compacto ? m.nombre : undefined} aria-label={compacto ? m.nombre : undefined}>
              <Icon name={m.icono} />
              {!compacto && <span className="flex-1">{m.nombre}</span>}
            </NavLink>
          ))}
        </div>
      ))}
    </>
  );
}

export default function AppLayout() {
  const [contraido, setContraido] = useState(leerContraido);   // escritorio: solo íconos
  const [cajon, setCajon] = useState(false);                  // pantallas chicas: panel deslizante

  useEffect(() => {
    try {
      localStorage.setItem(MENU_KEY, contraido ? '1' : '0');
    } catch {
      // sin almacenamiento local la preferencia dura solo la sesión
    }
  }, [contraido]);

  useEffect(() => {
    if (!cajon) return undefined;
    const esc = (e) => { if (e.key === 'Escape') setCajon(false); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [cajon]);

  // En escritorio el botón contrae/expande; en pantallas chicas abre el panel.
  const alternarMenu = () => {
    if (window.matchMedia('(min-width: 1024px)').matches) setContraido((v) => !v);
    else setCajon((v) => !v);
  };

  return (
    <div className="min-h-screen">
      <Encabezado onMenu={alternarMenu} contraido={contraido} />

      <div className="flex">
        {/* Escritorio: menú fijo bajo el encabezado, contraíble a íconos */}
        <nav aria-label="Módulos de RR.HH."
          className={`sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 flex-col gap-1 overflow-y-auto border-r border-linea bg-white/70 py-3 backdrop-blur-xl transition-[width] duration-200 lg:flex ${contraido ? 'w-[72px] px-2' : 'w-[248px] px-3'}`}>
          <Enlaces compacto={contraido} />
          <button type="button" className={`nav-link mt-auto text-gris ${contraido ? 'justify-center px-0!' : ''}`} onClick={() => setContraido((v) => !v)}
            aria-label={contraido ? 'Expandir menú' : 'Contraer menú'} title={contraido ? 'Expandir menú' : 'Contraer menú'}>
            <Icon name="panel" size={18} />
            {!contraido && <span className="flex-1 text-left text-[13px]">Contraer menú</span>}
          </button>
        </nav>

        {/* Pantallas chicas: panel deslizante con fondo */}
        <div className={`fixed inset-0 z-50 bg-tinta/30 transition-opacity lg:hidden ${cajon ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
          onClick={() => setCajon(false)} aria-hidden="true" />
        <nav aria-label="Módulos de RR.HH." aria-hidden={!cajon} inert={!cajon}
          className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col gap-1 overflow-y-auto bg-white px-3 py-3 shadow-2xl transition-transform duration-200 lg:hidden ${cajon ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="mb-2 flex items-center gap-2 px-1">
            <img src="/clinica_la_luz_isotipo.png" alt="" className="h-8 w-8 object-contain" />
            <span className="flex-1 text-sm font-extrabold text-rojo-texto">Recursos Humanos</span>
            <button type="button" className="btn btn-icon btn-sm" onClick={() => setCajon(false)} aria-label="Cerrar menú"><Icon name="cerrar" size={16} /></button>
          </div>
          <Enlaces compacto={false} onNavegar={() => setCajon(false)} />
        </nav>

        <main className="flex min-w-0 flex-1 flex-col gap-4 p-3 sm:p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
