import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Icon from '../../../components/Icon';
import { Aviso, Campo, ErrorForm, Indicador, Paginacion, Segmentado, Vacio } from '../../../components/ui';
import { mensajeError } from '../../../api/client';
import { guardarConfigVacaciones } from '../../../api/endpoints/vacaciones';
import { useAuth } from '../../../context/AuthContext';
import { fecha, iniciales, moneda, nombreEmpresa, nombrePersona, numero } from '../../../lib/format';
import RegistrarVacacionesModal from '../components/RegistrarVacacionesModal';
import SaldoVacaciones from '../components/SaldoVacaciones';
import { ETAPAS, FILTROS_PERSONAL, TIPOS } from '../constantes';
import { useAccionVacaciones, useVacacionesPersonal, useVacacionesResumen, useVacacionesTrabajador } from '../hooks/useVacaciones';

/** Habilitar al trabajador para pedir vacaciones desde la intranet y su límite anual. */
function ConfigIntranet({ empresa, codPersonal, saldo, onAviso }) {
  const { puede } = useAuth();
  const [habilitado, setHabilitado] = useState(Boolean(saldo?.habilitado_intranet));
  const [limite, setLimite] = useState(saldo?.limite_dias_anio ?? '');
  const [error, setError] = useState('');
  const mut = useAccionVacaciones((c) => guardarConfigVacaciones(empresa, codPersonal, c));

  if (!saldo || saldo.habilitado_intranet === null) {
    return <p className="text-xs text-gris">Esta empresa aún no tiene la opción de pedir vacaciones desde la intranet.</p>;
  }

  const cambio = habilitado !== Boolean(saldo.habilitado_intranet) || String(limite ?? '') !== String(saldo.limite_dias_anio ?? '');

  return (
    <form
      className="glass-soft flex flex-wrap items-end gap-3 px-4 py-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError('');
        mut.mutate({ habilitado, limite: limite === '' ? null : Number(limite) },
          { onSuccess: (r) => onAviso({ tipo: 'ok', texto: r.message }), onError: (err) => setError(mensajeError(err)) });
      }}
    >
      <label className="flex flex-[1_1_200px] items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={habilitado} disabled={!puede('vacaciones.gestionar')} onChange={(e) => setHabilitado(e.target.checked)} />
        Puede pedir vacaciones desde la intranet
      </label>
      <Campo etiqueta="Límite por año" className="w-[130px]">
        <input className="field min-h-[38px]!" type="number" min="1" max="60" placeholder="Sin límite" value={limite} disabled={!puede('vacaciones.gestionar')}
          onChange={(e) => setLimite(e.target.value)} />
      </Campo>
      {puede('vacaciones.gestionar') && <button type="submit" className="btn btn-sm" disabled={!cambio || mut.isPending}>{mut.isPending ? 'Guardando…' : 'Guardar'}</button>}
      <div className="w-full"><ErrorForm texto={error} /></div>
    </form>
  );
}

function Detalle({ seleccion, onRegistrar, onAviso }) {
  const { puede } = useAuth();
  const { data, isPending, isError, error } = useVacacionesTrabajador(seleccion?.empresa, seleccion?.cod_personal);
  const [abierto, setAbierto] = useState(null);

  if (!seleccion) return <aside className="glass flex-[1_1_380px] p-6 text-sm text-gris">Elija un trabajador para ver su saldo e historial.</aside>;
  if (isPending) return <aside className="glass flex flex-[1_1_380px] flex-col gap-3 p-6" aria-busy="true"><span className="skeleton h-10 w-2/3" /><span className="skeleton h-28 w-full" /><span className="skeleton h-40 w-full" /></aside>;
  if (isError) return <aside className="glass flex-[1_1_380px] p-6 text-sm font-semibold text-rojo-texto" role="alert">{mensajeError(error)}</aside>;

  const tramosDe = (p) => data.tramos.filter((t) => t.ano_proceso === p.ano_proceso && t.mes_proceso === p.mes_proceso && t.cod_corr_vac === p.cod_corr_vac);
  const nombre = data.saldo?.nombre_completo ?? seleccion.nombre_completo;

  return (
    <aside className="glass flex min-w-0 flex-[1_1_380px] flex-col gap-4 p-5.5" aria-label="Vacaciones del trabajador">
      <div className="flex items-center gap-3">
        <span className="avatar h-12! w-12!">{iniciales(nombrePersona(nombre ?? '').replace(',', ''))}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] leading-tight font-extrabold">{nombrePersona(nombre)}</h2>
          <p className="text-[13px] text-gris">{[data.saldo?.cargo, data.saldo?.area].filter(Boolean).map(nombrePersona).join(' · ')} · {nombreEmpresa(data.saldo?.empresa_nombre ?? '')}</p>
        </div>
      </div>

      <SaldoVacaciones saldo={data.saldo} />
      <ConfigIntranet key={`${seleccion.empresa}|${seleccion.cod_personal}|${data.saldo?.habilitado_intranet}|${data.saldo?.limite_dias_anio}`}
        empresa={seleccion.empresa} codPersonal={seleccion.cod_personal} saldo={data.saldo} onAviso={onAviso} />

      {puede('vacaciones.gestionar') && (
        <button type="button" className="btn btn-primary" onClick={() => onRegistrar({ ...seleccion, nombre_completo: nombre })}>
          <Icon name="mas" size={18} /> Registrar vacaciones en planilla
        </button>
      )}

      <div>
        <div className="label">Registrado en planilla ({data.procesos.length})</div>
        {data.procesos.length === 0 && <p className="mt-2 text-sm text-gris">Sin vacaciones registradas.</p>}
        <ul className="mt-2 flex flex-col gap-2">
          {data.procesos.slice(0, 15).map((p) => {
            const clave = `${p.ano_proceso}-${p.mes_proceso}-${p.cod_corr_vac}`;
            const tramos = tramosDe(p);
            const tipos = [...new Set(tramos.map((t) => t.tip_vacaciones))];
            return (
              <li key={clave} className="glass-soft px-3.5 py-2.5 text-[13px]">
                <button type="button" className="flex w-full items-center gap-2 text-left" aria-expanded={abierto === clave} onClick={() => setAbierto(abierto === clave ? null : clave)}>
                  <span className="w-[150px] font-semibold tabular-nums">{fecha(p.fec_inicio)} – {fecha(p.fec_fin)}</span>
                  <span className="flex-1">{numero(p.num_tot_dias)} días {tipos.map((t) => <span key={t} className={`badge ml-1 ${TIPOS[t]?.clase ?? 'badge-neutro'}`}>{TIPOS[t]?.texto ?? t}</span>)}</span>
                  <span className="tabular-nums text-gris">{p.imp_tot_vacacion ? moneda(p.imp_tot_vacacion) : ''}</span>
                  <Icon name="flecha" size={14} className={`text-gris transition-transform ${abierto === clave ? 'rotate-90' : ''}`} />
                </button>
                {abierto === clave && (
                  <div className="mt-2 border-t border-linea pt-2 text-xs">
                    <p className="text-gris">Proceso {p.ano_proceso}-{p.mes_proceso} · N° {p.cod_corr_vac} · {p.ind_transf_plan === 'S' ? 'transferido a planilla' : 'no transferido'} · {p.cod_user_actual}</p>
                    <ul className="mt-1.5 flex flex-col gap-1">
                      {tramos.map((t) => (
                        <li key={t.cod_num_sec} className="flex gap-2">
                          <span className="w-[150px] tabular-nums">{fecha(t.fec_inicio)} – {fecha(t.fec_final)}</span>
                          <span className="flex-1">{numero(t.num_dias)} días · {TIPOS[t.tip_vacaciones]?.largo ?? t.tip_vacaciones} · período {t.cod_periodo}</span>
                          {t.imp_adelanto_vacac ? <span>{moneda(t.imp_adelanto_vacac)}</span> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {data.solicitudes.length > 0 && (
        <div>
          <div className="label">Solicitudes desde la intranet</div>
          <ul className="mt-2 flex flex-col gap-1.5 text-[13px]">
            {data.solicitudes.map((s) => (
              <li key={s.cod_corr_sol} className="flex items-center gap-2">
                <span className="w-[150px] tabular-nums">{fecha(s.fec_inicio)} – {fecha(s.fec_final)}</span>
                <span className="flex-1">{s.num_dias} días · {TIPOS[s.tip_vacaciones]?.texto ?? s.tip_vacaciones}</span>
                <span className={`badge ${ETAPAS[s.etapa]?.clase ?? 'badge-neutro'}`}>{ETAPAS[s.etapa]?.texto ?? s.etapa}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}

/**
 * Persona del grupo: si trabaja en varias empresas (contratos o convenios en
 * cada una), muestra el saldo total y una pestaña por empresa; cada empresa
 * lleva su propio saldo, historial y registro en planilla.
 */
function DetallePersona({ persona, onRegistrar, onAviso }) {
  const empresas = persona?.detalle_empresas?.length
    ? persona.detalle_empresas
    : persona ? [{ empresa: persona.empresa, cod_personal: persona.cod_personal, empresa_nombre: persona.empresa_nombre }] : [];
  const [activa, setActiva] = useState(0);
  const actual = empresas[Math.min(activa, empresas.length - 1)];

  if (!persona) return <Detalle seleccion={null} />;

  return (
    <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-3">
      {empresas.length > 1 && (
        <section className="glass flex flex-col gap-3 p-4.5" aria-label="Empresas de la persona">
          <div className="flex items-baseline gap-2">
            <h2 className="flex-1 text-[15px] font-extrabold">Trabaja en {empresas.length} empresas del grupo</h2>
            <span className="text-sm">Total <strong className="text-lg tabular-nums">{numero(persona.saldo)}</strong> días</span>
          </div>
          <p className="text-xs text-gris">Cada empresa calcula su saldo con su propia fecha de ingreso y su historial; el total los suma (como el saldo consolidado de la intranet).</p>
          <div role="tablist" aria-label="Empresa" className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2">
            {empresas.map((e, i) => (
              <button key={e.empresa} type="button" role="tab" aria-selected={i === activa} onClick={() => setActiva(i)}
                className={`rounded-2xl border px-3 py-2 text-left ${i === activa ? 'border-rojo bg-rojo/[0.06]' : 'border-linea bg-white hover:bg-tinta/[0.03]'}`}>
                <span className="block truncate text-[13px] font-bold">{nombreEmpresa(e.empresa_nombre)}</span>
                <span className="block text-xs text-gris">{nombrePersona(e.cargo ?? '')} · ingreso {fecha(e.fec_ingreso)}</span>
                <span className={`block text-sm font-extrabold tabular-nums ${e.saldo < 0 ? 'text-rojo-texto' : ''}`}>{numero(e.saldo)} días</span>
              </button>
            ))}
          </div>
        </section>
      )}
      <Detalle key={`${actual.empresa}|${actual.cod_personal}`}
        seleccion={{ empresa: actual.empresa, cod_personal: actual.cod_personal, nombre_completo: persona.nombre_completo }}
        onRegistrar={onRegistrar} onAviso={onAviso} />
    </div>
  );
}

export default function VacacionesPersonalPage() {
  const [params, setParams] = useSearchParams();
  const filtro = params.get('filtro') ?? '';
  const q = params.get('q') ?? '';
  const orden = params.get('orden') ?? 'saldo';
  const page = Number(params.get('page') ?? 1);
  const preEmpresa = params.get('empresa');
  const preCod = params.get('cod');
  const [texto, setTexto] = useState(q || preCod || '');
  const [seleccion, setSeleccion] = useState(preEmpresa && preCod ? { empresa: preEmpresa, cod_personal: preCod } : null);
  const [modal, setModal] = useState(null);
  const [aviso, setAviso] = useState(null);

  const cambiar = (c) => {
    const n = { filtro, q, orden, page: 1, ...c };
    const limpio = {};
    if (n.filtro) limpio.filtro = n.filtro;
    if (n.q) limpio.q = n.q;
    if (n.orden !== 'saldo') limpio.orden = n.orden;
    if (n.page > 1) limpio.page = String(n.page);
    setSeleccion(null);
    setParams(limpio, { replace: true });
  };

  const resumen = useVacacionesResumen();
  const lista = useVacacionesPersonal({ filtro: filtro || undefined, q: (q || preCod) || undefined, orden, page, per_page: 25 });
  const filas = lista.data?.data ?? [];
  const meta = lista.data?.meta;
  const t = resumen.data?.totales;
  const actual = seleccion ?? filas[0] ?? null;
  const meses = resumen.data?.por_mes ?? [];
  const maxMes = Math.max(1, ...meses.map((m) => m.goce + m.compra));

  useEffect(() => {
    if (!aviso || aviso.tipo === 'error') return undefined;
    const id = setTimeout(() => setAviso(null), 6000);
    return () => clearTimeout(id);
  }, [aviso]);

  return (
    <>
      <section className="glass flex flex-wrap items-end gap-4 px-6 py-5">
        <div className="flex-[1_1_320px]">
          <nav aria-label="Ruta" className="text-[13px] font-medium text-gris">Tiempo y ausencias › <span className="font-semibold text-tinta">Vacaciones del personal</span></nav>
          <h1 className="mt-1 text-[28px] font-extrabold tracking-tight">Vacaciones del personal</h1>
          <p className="mt-1 text-sm text-gris">Saldo de cada trabajador (30 días por año cumplido menos lo registrado en planilla) e historial de goce y compra.</p>
        </div>
      </section>

      <Aviso aviso={aviso} onCerrar={() => setAviso(null)} />

      <section aria-label="Indicadores" className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
        <Indicador titulo="Personas" valor={t?.personal} detalle={`${numero(t?.dias_saldo)} días de saldo en total`} cargando={resumen.isPending} />
        <Indicador titulo="Saldo ≥ 30 días" valor={t?.acumuladas} detalle="Tienen un período completo" color="text-aviso" cargando={resumen.isPending}
          onClick={() => cambiar({ filtro: 'ACUMULADAS' })} activo={filtro === 'ACUMULADAS'} />
        <Indicador titulo="Saldo ≥ 60 días" valor={t?.doble_periodo} detalle="Dos períodos acumulados" color="text-rojo-texto" acento="rgb(177 26 26 / 0.55)" cargando={resumen.isPending}
          onClick={() => cambiar({ filtro: 'DOBLE_PERIODO' })} activo={filtro === 'DOBLE_PERIODO'} />
        <Indicador titulo="Saldo negativo" valor={t?.saldo_negativo} detalle="Adelantos o datos por revisar" cargando={resumen.isPending}
          onClick={() => cambiar({ filtro: 'SALDO_NEGATIVO' })} activo={filtro === 'SALDO_NEGATIVO'} />
        <Indicador titulo="En varias empresas" valor={t?.varias_empresas} detalle="Un saldo por empresa, sumados" color="text-info" cargando={resumen.isPending}
          onClick={() => cambiar({ filtro: 'VARIAS_EMPRESAS' })} activo={filtro === 'VARIAS_EMPRESAS'} />
        <div className="tile min-h-[124px]">
          <span className="label">Días registrados por mes</span>
          <div className="mt-1 flex h-12 items-end gap-1" role="img" aria-label="Días de goce y compra registrados en los últimos 12 meses">
            {meses.map((m) => (
              <span key={m.mes} className="flex flex-1 flex-col justify-end" title={`${m.mes}: ${m.goce} goce · ${m.compra} compra`} style={{ height: '100%' }}>
                <span className="rounded-t-[3px] bg-aviso/70" style={{ height: `${(m.compra / maxMes) * 100}%` }} />
                <span className="bg-gris/40" style={{ height: `${(m.goce / maxMes) * 100}%` }} />
              </span>
            ))}
          </div>
          <span className="text-[13px] text-gris">12 meses · gris goce · naranja compra</span>
        </div>
      </section>

      <section className="glass flex flex-wrap items-end gap-3 px-5 py-4" aria-label="Filtros">
        <form className="flex flex-[2_1_320px] items-end gap-2" onSubmit={(e) => { e.preventDefault(); cambiar({ q: texto.trim() }); }}>
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="label">Trabajador</span>
            <input className="field" type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Nombre, DNI o código" />
          </label>
          <button type="submit" className="btn">Buscar</button>
        </form>
        <label className="flex flex-[1_1_180px] flex-col gap-1.5">
          <span className="label">Ordenar por</span>
          <select className="field" value={orden} onChange={(e) => cambiar({ orden: e.target.value })}>
            <option value="saldo">Mayor saldo</option>
            <option value="-saldo">Menor saldo</option>
            <option value="nombre">Trabajador (A–Z)</option>
            <option value="ultimo">Último goce más antiguo</option>
            <option value="ingreso">Ingreso más antiguo</option>
          </select>
        </label>
      </section>

      <div className="flex flex-wrap items-start gap-4">
        <section className="glass min-w-0 flex-[999_1_560px] py-2" aria-label="Personal">
          <div className="overflow-x-auto px-5 pt-3 pb-3">
            <Segmentado etiqueta="Filtrar personal" valor={filtro} onCambio={(v) => cambiar({ filtro: v })}
              opciones={FILTROS_PERSONAL.map((f) => ({ ...f, total: meta?.conteos?.[f.conteo] }))} />
          </div>
          {lista.isError && <p role="alert" className="px-5 py-3 text-sm font-semibold text-rojo-texto">{mensajeError(lista.error)}</p>}
          <div className="overflow-x-auto">
            <table className="tbl min-w-[760px]">
              <thead>
                <tr>
                  <th scope="col" className="pl-5!">Trabajador</th><th scope="col">Empresa</th><th scope="col">Ingreso</th>
                  <th scope="col" className="text-right">Ganados</th><th scope="col" className="text-right">Usados</th>
                  <th scope="col" className="text-right">Saldo</th><th scope="col" className="pr-5!">Último goce</th>
                </tr>
              </thead>
              <tbody>
                {lista.isPending && [0, 1, 2].map((i) => <tr key={i}><td colSpan={7} className="px-5!"><span className="skeleton block h-6 w-full" /></td></tr>)}
                {!lista.isPending && filas.map((f) => {
                  const sel = actual && (actual.clave_persona
                    ? actual.clave_persona === f.clave_persona
                    : f.detalle_empresas?.some((e) => e.empresa === actual.empresa && e.cod_personal === actual.cod_personal));
                  const varias = f.empresas > 1;
                  return (
                    <tr key={f.clave_persona} className={`cursor-pointer ${sel ? 'fila-sel' : ''}`} onClick={() => setSeleccion(f)}>
                      <td className="pl-5!">
                        <button type="button" className="text-left font-bold hover:text-rojo-texto hover:underline" onClick={(e) => { e.stopPropagation(); setSeleccion(f); }}>
                          {nombrePersona(f.nombre_completo)}
                        </button>
                        <div className="text-xs text-gris">
                          {nombrePersona(f.cargo ?? '')}
                          {f.habilitado_intranet && <span className="badge badge-info ml-2 px-1.5! py-0! text-[10px]!">Intranet</span>}
                          {f.dias_solicitados > 0 && <span className="ml-2 font-semibold text-aviso">{numero(f.dias_solicitados)} días solicitados</span>}
                        </div>
                      </td>
                      <td>
                        {varias ? (
                          <div className="flex flex-col items-start gap-1">
                            <span className="badge badge-info">{f.empresas} empresas</span>
                            {f.detalle_empresas.map((e) => (
                              <span key={e.empresa} className="count whitespace-nowrap" title={`Saldo ${e.saldo} días`}>{nombreEmpresa(e.empresa_nombre)}</span>
                            ))}
                          </div>
                        ) : <span className="count whitespace-nowrap">{nombreEmpresa(f.empresa_nombre)}</span>}
                      </td>
                      <td className="text-[13px] tabular-nums">
                        {fecha(f.fec_ingreso)}
                        {varias && <div className="text-xs text-gris">el más antiguo</div>}
                      </td>
                      <td className="text-right tabular-nums">{numero(f.dias_ganados)}</td>
                      <td className="text-right tabular-nums">{numero(f.dias_usados)}</td>
                      <td className={`text-right font-extrabold tabular-nums ${f.saldo < 0 ? 'text-rojo-texto' : f.saldo >= 60 ? 'text-rojo-texto' : f.saldo >= 30 ? 'text-aviso' : ''}`}>{numero(f.saldo)}</td>
                      <td className="pr-5! text-[13px] tabular-nums">{fecha(f.ultimo_fin)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!lista.isPending && filas.length === 0 && <Vacio texto="No hay personal con estos filtros." />}
          <Paginacion meta={meta} onPagina={(p) => cambiar({ page: p })} />
        </section>

        <DetallePersona key={actual ? (actual.clave_persona ?? `${actual.empresa}|${actual.cod_personal}`) : 'nadie'}
          persona={actual} onRegistrar={(p) => setModal(p)} onAviso={setAviso} />
      </div>

      {modal && (
        <RegistrarVacacionesModal empresa={modal.empresa} codPersonal={modal.cod_personal} nombre={modal.nombre_completo}
          onCerrar={() => setModal(null)} onHecho={(m) => { setModal(null); setAviso({ tipo: 'ok', texto: m }); }} />
      )}
    </>
  );
}
