import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Icon from '../../../components/Icon';
import { Aviso, Dato, Indicador, Paginacion, Segmentado, Vacio } from '../../../components/ui';
import { mensajeError } from '../../../api/client';
import { useAuth } from '../../../context/AuthContext';
import { imprimirFormularioVac } from '../../../lib/formulariosVac';
import { fecha, fechaHora, iniciales, moneda, nombreEmpresa, nombrePersona, numero } from '../../../lib/format';
import RegistrarVacacionesModal from '../components/RegistrarVacacionesModal';
import ResolverSolicitudModal from '../components/ResolverSolicitudModal';
import SaldoVacaciones from '../components/SaldoVacaciones';
import { ETAPAS, PESTANAS_SOL, TIPOS, claveSolicitud } from '../constantes';
import { useSolicitudVac, useSolicitudesVac, useSolicitudesVacResumen } from '../hooks/useVacaciones';

const dmy = (iso) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '');

/** Formato oficial (SOLICITUD o COMPRA DE VACACIONES), el mismo de la intranet. */
function imprimir(s, saldo) {
  imprimirFormularioVac({
    solicitud: {
      tipo: s.tip_vacaciones, num_dias: s.num_dias, fec_inicio: dmy(s.fec_inicio), fec_final: dmy(s.fec_final),
      periodo_vac: s.periodo_vac, imp_adelanto: s.imp_adelanto_vacac, descuento_afp: s.descuento_afp, ano_proceso: s.ano_proceso,
    },
    empleado: {
      nombre_completo: s.nombre_completo, cargo: s.cargo, area: s.area,
      empresa: nombreEmpresa(s.empresa_nombre), sede: '', fecha_ingreso: saldo?.fec_ingreso,
    },
    user: { dni: s.dni },
  });
}

function Detalle({ seleccion, onAccion }) {
  const { puede } = useAuth();
  const { data, isPending, isError, error } = useSolicitudVac(seleccion);

  if (!seleccion) return <aside className="glass flex-[1_1_360px] p-6 text-sm text-gris">Elija una solicitud para ver el detalle y atenderla.</aside>;
  if (isPending) return <aside className="glass flex flex-[1_1_360px] flex-col gap-3 p-6" aria-busy="true"><span className="skeleton h-10 w-2/3" /><span className="skeleton h-28 w-full" /><span className="skeleton h-24 w-full" /></aside>;
  if (isError) return <aside className="glass flex-[1_1_360px] p-6 text-sm font-semibold text-rojo-texto" role="alert">{mensajeError(error)}</aside>;

  const s = { ...data.solicitud, empresa: seleccion.empresa };
  const etapa = ETAPAS[s.etapa] ?? ETAPAS.OTRO;
  const tipo = TIPOS[s.tip_vacaciones] ?? { largo: s.tip_vacaciones, clase: 'badge-neutro' };
  const gestionar = puede('vacaciones.gestionar');
  const pendiente = ['PENDIENTE_JEFE', 'PENDIENTE_RRHH'].includes(s.etapa);

  return (
    <aside className="glass flex min-w-0 flex-[1_1_360px] flex-col gap-4 p-5.5" aria-label="Detalle de la solicitud">
      <div className="flex items-center gap-3">
        <span className="avatar h-12! w-12!">{iniciales(nombrePersona(s.nombre_completo).replace(',', ''))}</span>
        <div className="min-w-0">
          <h2 className="text-[17px] leading-tight font-extrabold">{nombrePersona(s.nombre_completo)}</h2>
          <p className="text-[13px] text-gris">{[s.cargo, s.area].filter(Boolean).map(nombrePersona).join(' · ')}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`badge ${tipo.clase}`}>{tipo.largo}</span>
        <span className={`badge ${etapa.clase}`}>{etapa.texto}</span>
        <span className="ml-auto text-[13px] text-gris">N° {s.cod_corr_sol}</span>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Dato etiqueta="Desde">{fecha(s.fec_inicio)}</Dato>
        <Dato etiqueta="Hasta">{fecha(s.fec_final)}</Dato>
        <Dato etiqueta="Días">{s.num_dias}</Dato>
        <Dato etiqueta="Período vacacional">{s.periodo_vac || '—'}</Dato>
        <Dato etiqueta="Empresa">{nombreEmpresa(s.empresa_nombre)}</Dato>
        <Dato etiqueta="Jefe (intranet)">{s.jefe_nombre ? nombrePersona(s.jefe_nombre) : s.jefe_usuario || 'Sin jefe'}</Dato>
        {s.tip_vacaciones === 'VC' && (
          <>
            <Dato etiqueta="Adelanto">{moneda(s.imp_adelanto_vacac)}</Dato>
            <Dato etiqueta="Descuento AFP · recibe">{moneda(s.descuento_afp)} · {moneda(s.importe_neto)}</Dato>
          </>
        )}
        <div className="col-span-2"><Dato etiqueta="Última acción">{s.cod_user_actual} · {fechaHora(s.fec_actualiza)}</Dato></div>
        {(s.obs_rrhh || s.obs_jefe) && <div className="col-span-2"><Dato etiqueta="Observación">{s.obs_rrhh || s.obs_jefe}</Dato></div>}
      </dl>

      <SaldoVacaciones saldo={data.saldo} diasSolicitud={pendiente || s.etapa === 'POR_PLANILLA' ? s.num_dias : null} />

      {data.otras.length > 0 && (
        <div>
          <div className="label">Otras solicitudes</div>
          <ul className="mt-2 flex flex-col gap-1.5 text-[13px]">
            {data.otras.slice(0, 5).map((o) => (
              <li key={o.cod_corr_sol} className="flex items-center gap-2">
                <span className="w-24 tabular-nums">{fecha(o.fec_inicio)}</span>
                <span className="flex-1">{o.num_dias} días · {TIPOS[o.tip_vacaciones]?.texto ?? o.tip_vacaciones}</span>
                <span className={`badge ${ETAPAS[o.etapa]?.clase ?? 'badge-neutro'}`}>{ETAPAS[o.etapa]?.texto ?? o.etapa}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-linea pt-4">
        {gestionar && pendiente && (
          <div className="grid grid-cols-3 gap-2">
            <button type="button" className="btn btn-sm btn-ok" onClick={() => onAccion('aprobar', s, data)}>Aprobar</button>
            <button type="button" className="btn btn-sm btn-peligro" onClick={() => onAccion('rechazar', s, data)}>Rechazar</button>
            <button type="button" className="btn btn-sm" onClick={() => onAccion('cancelar', s, data)}>Cancelar</button>
          </div>
        )}
        {gestionar && s.etapa === 'POR_PLANILLA' && (
          <button type="button" className="btn btn-primary" onClick={() => onAccion('registrar', s, data)}>
            <Icon name="vacaciones" size={18} /> Registrar en planilla
          </button>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn btn-sm" onClick={() => imprimir(s, data.saldo)}>Imprimir formato</button>
          <Link to={`/vacaciones/personal?empresa=${s.empresa}&cod=${s.cod_personal}`} className="btn btn-sm">Ver vacaciones</Link>
        </div>
      </div>
    </aside>
  );
}

export default function SolicitudesVacPage() {
  const [params, setParams] = useSearchParams();
  const etapa = params.get('etapa') ?? 'POR_ATENDER';
  const tipo = params.get('tipo') ?? '';
  const q = params.get('q') ?? '';
  const page = Number(params.get('page') ?? 1);
  const [texto, setTexto] = useState(q);
  const [seleccion, setSeleccion] = useState(null);
  const [modal, setModal] = useState(null);
  const [aviso, setAviso] = useState(null);

  const cambiar = (c) => {
    const n = { etapa, tipo, q, page: 1, ...c };
    const limpio = {};
    if (n.etapa !== 'POR_ATENDER') limpio.etapa = n.etapa;
    if (n.tipo) limpio.tipo = n.tipo;
    if (n.q) limpio.q = n.q;
    if (n.page > 1) limpio.page = String(n.page);
    setSeleccion(null);
    setParams(limpio, { replace: true });
  };

  const resumen = useSolicitudesVacResumen();
  const lista = useSolicitudesVac({ etapa: etapa || undefined, tipo: tipo || undefined, q: q || undefined, page, per_page: 25, orden: 'inicio' });
  const filas = lista.data?.data ?? [];
  const meta = lista.data?.meta;
  const t = resumen.data?.totales;
  const actual = seleccion ?? filas[0] ?? null;

  useEffect(() => {
    if (!aviso || aviso.tipo === 'error') return undefined;
    const id = setTimeout(() => setAviso(null), 6000);
    return () => clearTimeout(id);
  }, [aviso]);

  const terminar = (mensaje) => { setModal(null); setAviso({ tipo: 'ok', texto: mensaje }); };

  return (
    <>
      <section className="glass flex flex-wrap items-end gap-4 px-6 py-5">
        <div className="flex-[1_1_320px]">
          <nav aria-label="Ruta" className="text-[13px] font-medium text-gris">Tiempo y ausencias › <span className="font-semibold text-tinta">Solicitudes de vacaciones</span></nav>
          <h1 className="mt-1 text-[28px] font-extrabold tracking-tight">Solicitudes de vacaciones</h1>
          <p className="mt-1 text-sm text-gris">Lo que el personal pide desde la intranet: goce y compra de vacaciones. RR.HH. aprueba y registra en planilla.</p>
        </div>
      </section>

      <Aviso aviso={aviso} onCerrar={() => setAviso(null)} />

      <section aria-label="Indicadores" className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
        <Indicador titulo="Pendientes del jefe" valor={t?.pendiente_jefe} detalle="RR.HH. puede aprobar directo" color="text-aviso" cargando={resumen.isPending}
          onClick={() => cambiar({ etapa: 'PENDIENTE_JEFE' })} activo={etapa === 'PENDIENTE_JEFE'} />
        <Indicador titulo="Pendientes de RR.HH." valor={t?.pendiente_rrhh} detalle="Ya aprobadas por el jefe" color="text-info" cargando={resumen.isPending}
          onClick={() => cambiar({ etapa: 'PENDIENTE_RRHH' })} activo={etapa === 'PENDIENTE_RRHH'} />
        <Indicador titulo="Por registrar en planilla" valor={t?.por_planilla} detalle="Aprobadas por RR.HH." color="text-ok" cargando={resumen.isPending}
          onClick={() => cambiar({ etapa: 'POR_PLANILLA' })} activo={etapa === 'POR_PLANILLA'} />
        <Indicador titulo="Inician en 7 días o menos" valor={t?.inician_7} detalle="O ya iniciaron sin cerrar" color="text-rojo-texto" acento="rgb(177 26 26 / 0.55)" cargando={resumen.isPending} />
        <Indicador titulo="Compras por atender" valor={t?.compras_por_atender} detalle={`Por pagar: ${moneda(t?.importe_compras ?? 0)}`} cargando={resumen.isPending}
          onClick={() => cambiar({ etapa: 'POR_ATENDER', tipo: 'VC' })} activo={tipo === 'VC'} />
      </section>

      <section className="glass flex flex-wrap items-end gap-3 px-5 py-4" aria-label="Filtros">
        <form className="flex flex-[2_1_320px] items-end gap-2" onSubmit={(e) => { e.preventDefault(); cambiar({ q: texto.trim() }); }}>
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="label">Trabajador</span>
            <input className="field" type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Nombre, DNI o código" />
          </label>
          <button type="submit" className="btn">Buscar</button>
        </form>
        <div className="flex flex-col gap-1.5">
          <span className="label">Tipo</span>
          <Segmentado etiqueta="Tipo de solicitud" valor={tipo} onCambio={(v) => cambiar({ tipo: v })}
            opciones={[{ valor: '', texto: 'Todas' }, { valor: 'VG', texto: 'Goce' }, { valor: 'VC', texto: 'Compra' }]} />
        </div>
      </section>

      <div className="flex flex-wrap items-start gap-4">
        <section className="glass min-w-0 flex-[999_1_600px] py-2" aria-label="Lista de solicitudes">
          <div className="overflow-x-auto px-5 pt-3 pb-3">
            <Segmentado etiqueta="Etapa" valor={etapa} onCambio={(v) => cambiar({ etapa: v })}
              opciones={PESTANAS_SOL.map((p) => ({ ...p, total: meta?.conteos?.[p.conteo] }))} />
          </div>
          {lista.isError && <p role="alert" className="px-5 py-3 text-sm font-semibold text-rojo-texto">{mensajeError(lista.error)}</p>}
          <div className="overflow-x-auto">
            <table className="tbl min-w-[780px]">
              <thead>
                <tr>
                  <th scope="col" className="pl-5!">Trabajador</th><th scope="col">Empresa</th><th scope="col">Tipo</th>
                  <th scope="col">Fechas</th><th scope="col" className="text-right">Días</th><th scope="col" className="pr-5!">Etapa</th>
                </tr>
              </thead>
              <tbody>
                {lista.isPending && [0, 1, 2].map((i) => <tr key={i}><td colSpan={6} className="px-5!"><span className="skeleton block h-6 w-full" /></td></tr>)}
                {!lista.isPending && filas.map((f) => {
                  const sel = actual && claveSolicitud(f) === claveSolicitud(actual);
                  const et = ETAPAS[f.etapa] ?? ETAPAS.OTRO;
                  const tp = TIPOS[f.tip_vacaciones] ?? { texto: f.tip_vacaciones, clase: 'badge-neutro' };
                  const urgente = ['PENDIENTE_JEFE', 'PENDIENTE_RRHH', 'POR_PLANILLA'].includes(f.etapa) && f.dias_para_inicio <= 7;
                  return (
                    <tr key={claveSolicitud(f)} className={`cursor-pointer ${sel ? 'fila-sel' : ''}`} onClick={() => setSeleccion(f)}>
                      <td className="pl-5!">
                        <button type="button" className="text-left font-bold hover:text-rojo-texto hover:underline" onClick={(e) => { e.stopPropagation(); setSeleccion(f); }}>
                          {nombrePersona(f.nombre_completo)}
                        </button>
                        <div className="text-xs text-gris">{nombrePersona(f.cargo ?? '')}</div>
                      </td>
                      <td><span className="count whitespace-nowrap">{nombreEmpresa(f.empresa_nombre)}</span></td>
                      <td><span className={`badge ${tp.clase}`}>{tp.texto}</span></td>
                      <td className="text-[13px] whitespace-nowrap tabular-nums">
                        {fecha(f.fec_inicio)} – {fecha(f.fec_final)}
                        {urgente && <div className={`text-xs font-semibold ${f.dias_para_inicio < 0 ? 'text-rojo-texto' : 'text-aviso'}`}>
                          {f.dias_para_inicio < 0 ? `Inició hace ${-f.dias_para_inicio} días` : f.dias_para_inicio === 0 ? 'Inicia hoy' : `Inicia en ${f.dias_para_inicio} días`}
                        </div>}
                      </td>
                      <td className="text-right font-bold tabular-nums">{f.num_dias}</td>
                      <td className="pr-5!"><span className={`badge ${et.clase}`}>{et.texto}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!lista.isPending && filas.length === 0 && <Vacio texto="No hay solicitudes con estos filtros." />}
          <Paginacion meta={meta} onPagina={(p) => cambiar({ page: p })} />
          <p className="px-5 pb-3 text-xs text-gris">{numero(meta?.conteos?.todos)} solicitudes en total desde la intranet.</p>
        </section>

        <Detalle seleccion={actual} onAccion={(accion, s, datos) => setModal({ accion, s, datos })} />
      </div>

      {modal && ['aprobar', 'rechazar', 'cancelar'].includes(modal.accion) && (
        <ResolverSolicitudModal solicitud={modal.s} accion={modal.accion} onCerrar={() => setModal(null)} onHecho={terminar} />
      )}
      {modal?.accion === 'registrar' && (
        <RegistrarVacacionesModal empresa={modal.s.empresa} codPersonal={modal.s.cod_personal} nombre={modal.s.nombre_completo}
          solicitud={modal.s} onCerrar={() => setModal(null)} onHecho={terminar} />
      )}
    </>
  );
}
