import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../components/Icon';
import { Indicador, Paginacion, Segmentado, Vacio } from '../../../components/ui';
import { mensajeError } from '../../../api/client';
import { useAuth } from '../../../context/AuthContext';
import { fecha, iniciales, nombreEmpresa, nombrePersona, numero, periodoTexto } from '../../../lib/format';
import AsignarEvaluacionModal from '../components/AsignarEvaluacionModal';
import { useEstructura, usePersonalNodo } from '../hooks/useEstructura';

const FILTROS = [
  { valor: '', texto: 'Todos' },
  { valor: 'POR_EVALUAR', texto: 'Por evaluar' },
  { valor: 'POR_VENCER', texto: 'Contrato por vencer' },
  { valor: 'SIN_JEFE', texto: 'Sin jefe' },
  { valor: 'SIN_CONTRATO', texto: 'Sin contrato' },
];

const SITUACION = {
  VIGENTE: { texto: 'Vigente', clase: 'text-ok' },
  INDETERMINADO: { texto: 'Indeterminado', clase: 'text-ok' },
  POR_VENCER: { texto: 'Por vencer', clase: 'text-aviso' },
  VENCIDO_SIN_CERRAR: { texto: 'Vencido sin cerrar', clase: 'text-rojo-texto' },
  SIN_CONTRATO: { texto: 'Sin contrato', clase: 'text-gris' },
};

const sumar = (a, f) => {
  a.personal += f.personal;
  a.por_evaluar += f.por_evaluar;
  a.por_vencer += f.por_vencer;
  a.sin_jefe += f.sin_jefe;
};
const vacio = () => ({ personal: 0, por_evaluar: 0, por_vencer: 0, sin_jefe: 0 });

/** Filas planas (empresa/sede/área/cargo) → árbol con totales en cada nivel. */
function armarArbol(filas) {
  const empresas = new Map();
  for (const f of filas) {
    if (!empresas.has(f.empresa)) empresas.set(f.empresa, { clave: f.empresa, nombre: f.empresa_nombre, t: vacio(), hijos: new Map() });
    const e = empresas.get(f.empresa);
    if (!e.hijos.has(f.cod_sede)) e.hijos.set(f.cod_sede, { clave: f.cod_sede, nombre: f.sede, t: vacio(), hijos: new Map() });
    const s = e.hijos.get(f.cod_sede);
    if (!s.hijos.has(f.cod_area)) s.hijos.set(f.cod_area, { clave: f.cod_area, nombre: f.area, t: vacio(), hijos: [] });
    const a = s.hijos.get(f.cod_area);
    a.hijos.push({ clave: f.cod_cargo, nombre: f.cargo, directivo: f.directivo, jefes: f.jefes, t: { personal: f.personal, por_evaluar: f.por_evaluar, por_vencer: f.por_vencer, sin_jefe: f.sin_jefe } });
    [e.t, s.t, a.t].forEach((x) => sumar(x, f));
  }
  return [...empresas.values()];
}

function Contadores({ t }) {
  return (
    <span className="ml-auto flex shrink-0 items-center gap-1.5">
      {t.por_evaluar > 0 && <span className="badge badge-info px-1.5! py-0! text-[11px]!" title="Por evaluar">{t.por_evaluar}</span>}
      <span className="count tabular-nums" title="Personal activo">{numero(t.personal)}</span>
    </span>
  );
}

function Nodo({ nivel, nodo, ruta, seleccion, onElegir, abiertos, alternar }) {
  const id = ruta.join('|');
  const abierto = abiertos.has(id);
  const hijos = nivel < 3 ? [...(nodo.hijos instanceof Map ? nodo.hijos.values() : nodo.hijos)] : [];
  const elegido = seleccion.id === id;
  const etiqueta = nivel === 0 ? nombreEmpresa(nodo.nombre) : nombrePersona(nodo.nombre);
  const icono = ['contratos', 'inicio', 'estructura', 'personal'][nivel];

  return (
    <li>
      <div className={`flex items-center gap-1 rounded-xl pr-2 ${elegido ? 'bg-rojo/[0.08]' : 'hover:bg-tinta/[0.04]'}`} style={{ paddingLeft: `${nivel * 14}px` }}>
        {hijos.length > 0 ? (
          <button type="button" className="flex h-8 w-7 shrink-0 items-center justify-center text-gris" aria-expanded={abierto}
            aria-label={`${abierto ? 'Contraer' : 'Expandir'} ${etiqueta}`} onClick={() => alternar(id)}>
            <Icon name="flecha" size={14} className={`transition-transform ${abierto ? 'rotate-90' : ''}`} />
          </button>
        ) : <span className="w-7 shrink-0" />}
        <button type="button" aria-current={elegido ? 'true' : undefined}
          className={`flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left text-[13px] ${elegido ? 'font-bold text-rojo-texto' : nivel === 0 ? 'font-bold' : 'font-medium'}`}
          onClick={() => { onElegir({ id, nivel, ruta, etiqueta }); if (!abierto && hijos.length) alternar(id); }}>
          <Icon name={icono} size={15} className="shrink-0 text-gris" />
          <span className="truncate" title={etiqueta}>{etiqueta}</span>
          {nodo.directivo && <span className="badge badge-neutro px-1.5! py-0! text-[10px]!">Directivo</span>}
          <Contadores t={nodo.t} />
        </button>
      </div>
      {abierto && hijos.length > 0 && (
        <ul>
          {hijos.map((h) => (
            <Nodo key={h.clave} nivel={nivel + 1} nodo={h} ruta={[...ruta, h.clave]} seleccion={seleccion}
              onElegir={onElegir} abiertos={abiertos} alternar={alternar} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function EstructuraPage() {
  const { puede, empresas } = useAuth();
  const estructura = useEstructura();
  const arbol = useMemo(() => armarArbol(estructura.data ?? []), [estructura.data]);

  const [seleccion, setSeleccion] = useState({ id: '', nivel: -1, ruta: [], etiqueta: 'Todas las empresas' });
  const [abiertos, setAbiertos] = useState(() => new Set());
  const [filtro, setFiltro] = useState('');
  const [texto, setTexto] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [marcados, setMarcados] = useState(() => new Map());
  const [modal, setModal] = useState(false);

  const [empresa, sede, area, cargo] = seleccion.ruta;
  const personal = usePersonalNodo({ empresa, sede, area, cargo, filtro: filtro || undefined, q: q || undefined, page, per_page: 50 });
  const filas = personal.data?.data ?? [];

  const totales = useMemo(() => arbol.reduce((t, e) => { sumar(t, e.t); return t; }, vacio()), [arbol]);
  const marcadosLista = [...marcados.values()];
  const empresasMarcadas = new Set(marcadosLista.map((p) => p.empresa));
  const puedeAsignar = puede('evaluaciones.gestionar');

  const alternar = (id) => setAbiertos((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const elegir = (nodo) => { setSeleccion(nodo); setPage(1); setMarcados(new Map()); };
  const marcar = (p) => setMarcados((m) => {
    const n = new Map(m);
    const k = `${p.empresa}|${p.cod_personal}`;
    if (n.has(k)) n.delete(k); else n.set(k, p);
    return n;
  });
  const elegibles = filas.filter((p) => p.eval_modulo);
  const todosMarcados = elegibles.length > 0 && elegibles.every((p) => marcados.has(`${p.empresa}|${p.cod_personal}`));
  const marcarTodos = () => setMarcados((m) => {
    const n = new Map(m);
    elegibles.forEach((p) => (todosMarcados ? n.delete(`${p.empresa}|${p.cod_personal}`) : n.set(`${p.empresa}|${p.cod_personal}`, p)));
    return n;
  });

  const empresaAsignar = empresasMarcadas.size === 1 ? [...empresasMarcadas][0] : null;

  return (
    <>
      <section className="glass flex flex-wrap items-end gap-4 px-6 py-5">
        <div className="flex-[1_1_320px]">
          <nav aria-label="Ruta" className="text-[13px] font-medium text-gris">Organización › <span className="font-semibold text-tinta">Estructura organizacional</span></nav>
          <h1 className="mt-1 text-[28px] font-extrabold tracking-tight">Estructura organizacional</h1>
          <p className="mt-1 text-sm text-gris">Personal activo por empresa, sede, área y cargo, con su jefe en la intranet. Desde aquí se asignan las evaluaciones para renovación.</p>
        </div>
      </section>

      <section aria-label="Indicadores" className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
        <Indicador titulo="Personal activo" valor={totales.personal} detalle={`${arbol.length} empresas`} cargando={estructura.isPending} />
        <Indicador titulo="Por evaluar" valor={totales.por_evaluar} detalle="Contrato por vencer sin evaluación" color="text-info"
          cargando={estructura.isPending} onClick={() => { setFiltro('POR_EVALUAR'); setPage(1); }} activo={filtro === 'POR_EVALUAR'} />
        <Indicador titulo="Contrato por vencer" valor={totales.por_vencer} detalle="En 30 días o vencido sin cerrar" color="text-aviso"
          cargando={estructura.isPending} onClick={() => { setFiltro('POR_VENCER'); setPage(1); }} activo={filtro === 'POR_VENCER'} />
        <Indicador titulo="Sin jefe en la intranet" valor={totales.sin_jefe} detalle="No podrán ser evaluados por un jefe" color="text-rojo-texto"
          cargando={estructura.isPending} onClick={() => { setFiltro('SIN_JEFE'); setPage(1); }} activo={filtro === 'SIN_JEFE'} />
      </section>

      {estructura.isError && <p role="alert" className="glass px-5 py-4 text-sm font-semibold text-rojo-texto">{mensajeError(estructura.error)}</p>}

      <div className="flex flex-wrap items-start gap-4">
        <nav aria-label="Árbol de la estructura" className="glass flex max-h-[calc(100vh-6rem)] min-w-0 flex-[1_1_320px] flex-col overflow-hidden lg:sticky lg:top-20">
          <div className="flex items-center gap-2 border-b border-linea px-4 py-3">
            <h2 className="flex-1 text-[15px] font-extrabold">Empresa › Sede › Área › Cargo</h2>
            <button type="button" className="btn btn-sm" onClick={() => setAbiertos(new Set())}>Contraer</button>
          </div>
          <div className="overflow-y-auto px-2 py-2">
            <button type="button" aria-current={seleccion.nivel === -1 ? 'true' : undefined}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] font-bold ${seleccion.nivel === -1 ? 'bg-rojo/[0.08] text-rojo-texto' : 'hover:bg-tinta/[0.04]'}`}
              onClick={() => elegir({ id: '', nivel: -1, ruta: [], etiqueta: 'Todas las empresas' })}>
              Todas las empresas <Contadores t={totales} />
            </button>
            {estructura.isPending && <span className="skeleton mt-2 block h-40 w-full" />}
            <ul>
              {arbol.map((e) => (
                <Nodo key={e.clave} nivel={0} nodo={e} ruta={[e.clave]} seleccion={seleccion} onElegir={elegir} abiertos={abiertos} alternar={alternar} />
              ))}
            </ul>
          </div>
          <p className="border-t border-linea px-4 py-2.5 text-xs text-gris">
            <span className="badge badge-info mr-1 px-1.5! py-0!">n</span> por evaluar · <span className="count">n</span> personal activo
          </p>
        </nav>

        <section className="glass min-w-0 flex-[999_1_560px] py-2" aria-label="Personal del nodo">
          <div className="flex flex-wrap items-center gap-3 px-5 pt-3 pb-3">
            <div className="min-w-0 flex-[1_1_240px]">
              <h2 className="truncate text-[17px] font-extrabold">{seleccion.etiqueta}</h2>
              <p className="text-xs text-gris">{numero(personal.data?.meta?.total)} trabajadores{personal.isFetching && !personal.isPending ? ' · actualizando…' : ''}</p>
            </div>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setQ(texto.trim()); setPage(1); }}>
              <input className="field min-h-[38px]! w-[220px]!" type="search" placeholder="Nombre, DNI o código" value={texto} onChange={(e) => setTexto(e.target.value)} aria-label="Buscar en el nodo" />
              <button type="submit" className="btn btn-sm">Buscar</button>
            </form>
          </div>
          <div className="flex flex-wrap items-center gap-3 px-5 pb-3">
            <Segmentado etiqueta="Filtrar personal" opciones={FILTROS} valor={filtro} onCambio={(v) => { setFiltro(v); setPage(1); }} />
          </div>

          {puedeAsignar && marcados.size > 0 && (
            <div className="mx-5 mb-3 flex flex-wrap items-center gap-3 rounded-2xl bg-rojo/[0.06] px-4 py-2.5 text-sm" role="status">
              <span className="flex-1 font-semibold">{marcados.size} {marcados.size === 1 ? 'seleccionado' : 'seleccionados'}</span>
              {empresasMarcadas.size > 1 && <span className="text-xs text-rojo-texto">Elija trabajadores de una sola empresa para asignar.</span>}
              <button type="button" className="btn btn-sm" onClick={() => setMarcados(new Map())}>Quitar selección</button>
              <button type="button" className="btn btn-sm btn-primary" disabled={!empresaAsignar} onClick={() => setModal(true)}>
                <Icon name="evaluacion" size={16} /> Asignar evaluación
              </button>
            </div>
          )}

          {personal.isError && <p role="alert" className="px-5 py-3 text-sm font-semibold text-rojo-texto">{mensajeError(personal.error)}</p>}

          <div className="overflow-x-auto">
            <table className="tbl min-w-[820px]">
              <thead>
                <tr>
                  {puedeAsignar && (
                    <th scope="col" className="w-10 pl-5!">
                      <input type="checkbox" aria-label="Seleccionar todos los de la página" checked={todosMarcados} onChange={marcarTodos} disabled={!elegibles.length} />
                    </th>
                  )}
                  <th scope="col" className={puedeAsignar ? '' : 'pl-5!'}>Trabajador</th>
                  <th scope="col">Ubicación</th>
                  <th scope="col">Jefe (intranet)</th>
                  <th scope="col">Contrato</th>
                  <th scope="col" className="pr-5!">Evaluación</th>
                </tr>
              </thead>
              <tbody>
                {personal.isPending && [0, 1, 2, 3].map((i) => (
                  <tr key={i}><td colSpan={6} className="px-5!"><span className="skeleton block h-6 w-full" /></td></tr>
                ))}
                {!personal.isPending && filas.map((p) => {
                  const k = `${p.empresa}|${p.cod_personal}`;
                  const sit = SITUACION[p.situacion_contrato] ?? SITUACION.SIN_CONTRATO;
                  return (
                    <tr key={k} className={marcados.has(k) ? 'fila-sel' : ''}>
                      {puedeAsignar && (
                        <td className="pl-5!">
                          <input type="checkbox" checked={marcados.has(k)} onChange={() => marcar(p)} disabled={!p.eval_modulo}
                            aria-label={`Seleccionar a ${nombrePersona(p.nombre_completo)}`}
                            title={p.eval_modulo ? undefined : 'La empresa no tiene el módulo de evaluaciones'} />
                        </td>
                      )}
                      <td className={puedeAsignar ? '' : 'pl-5!'}>
                        <div className="flex items-center gap-3">
                          <span className="avatar">{iniciales(nombrePersona(p.nombre_completo).replace(',', ''))}</span>
                          <div className="min-w-0">
                            <div className="font-bold">{nombrePersona(p.nombre_completo)}</div>
                            <div className="text-xs text-gris">{nombrePersona(p.cargo)}{p.directivo ? ' · Directivo' : ''} · DNI {p.dni ?? '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-[13px]">
                        <div>{nombrePersona(p.area)}</div>
                        <div className="text-xs text-gris">{nombreEmpresa(p.empresa_nombre)} · {nombrePersona(p.sede)}</div>
                      </td>
                      <td className="text-[13px]">{p.jefe_nombre ? nombrePersona(p.jefe_nombre) : <span className="font-semibold text-rojo-texto">Sin jefe</span>}</td>
                      <td className="text-[13px] whitespace-nowrap">
                        <div className={`font-semibold ${sit.clase}`}>{sit.texto}</div>
                        {p.contrato_fec_fin && <div className="text-xs text-gris">Fin {fecha(p.contrato_fec_fin)}</div>}
                      </td>
                      <td className="pr-5! text-[13px]">
                        {p.eval_periodo ? (
                          <Link to={`/evaluaciones/${p.empresa}/${p.cod_personal}?periodo=${p.eval_periodo}`} className="font-semibold capitalize hover:text-rojo-texto hover:underline">
                            {periodoTexto(p.eval_periodo)}
                          </Link>
                        ) : p.por_evaluar ? <span className="badge badge-info">Por evaluar</span>
                          : <span className="text-gris">{p.eval_modulo ? '—' : 'Sin módulo'}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!personal.isPending && filas.length === 0 && <Vacio texto="No hay personal con estos filtros." />}
          <Paginacion meta={personal.data?.meta} onPagina={setPage} />
        </section>
      </div>

      {modal && empresaAsignar && (
        <AsignarEvaluacionModal
          empresa={empresaAsignar}
          empresaNombre={empresas.find((e) => e.empresa === empresaAsignar)?.nombre ?? empresaAsignar}
          personas={marcadosLista}
          onCerrar={() => { setModal(false); setMarcados(new Map()); }}
        />
      )}
    </>
  );
}
