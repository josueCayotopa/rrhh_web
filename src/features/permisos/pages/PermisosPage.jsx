import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Icon from '../../../components/Icon';
import { Aviso, Indicador, Paginacion, Segmentado, Vacio } from '../../../components/ui';
import { mensajeError } from '../../../api/client';
import { useAuth } from '../../../context/AuthContext';
import { fecha, nombreEmpresa, nombrePersona, numero, periodoTexto } from '../../../lib/format';
import PermisoDetalle from '../components/PermisoDetalle';
import RegistrarPermisoModal from '../components/RegistrarPermisoModal';
import { ETAPAS, MOTIVOS, PESTANAS, claveSolicitud, horario, textoEtapa } from '../constantes';
import { usePermisos, usePermisosResumen } from '../hooks/usePermisos';

/**
 * Permisos: bandeja de RR.HH. del formato de autorización de permisos.
 * El trabajador pide en la intranet, su jefe autoriza ("Administrador de Sede")
 * y RR.HH. aprueba aquí.
 */
export default function PermisosPage() {
  const { puede } = useAuth();
  const [params, setParams] = useSearchParams();
  const etapa = params.get('etapa') ?? 'POR_ATENDER';
  const motivo = params.get('motivo') ?? '';
  const desde = params.get('desde') ?? '';
  const hasta = params.get('hasta') ?? '';
  const q = params.get('q') ?? '';
  const page = Number(params.get('page') ?? 1);
  const [texto, setTexto] = useState(q);
  const [seleccion, setSeleccion] = useState(null);
  const [registrar, setRegistrar] = useState(false);
  const [aviso, setAviso] = useState(null);

  const cambiar = (c) => {
    const n = { etapa, motivo, desde, hasta, q, page: 1, ...c };
    const limpio = {};
    if (n.etapa !== 'POR_ATENDER') limpio.etapa = n.etapa;
    ['motivo', 'desde', 'hasta', 'q'].forEach((k) => { if (n[k]) limpio[k] = n[k]; });
    if (n.page > 1) limpio.page = String(n.page);
    setSeleccion(null);
    setParams(limpio, { replace: true });
  };

  const resumen = usePermisosResumen();
  const lista = usePermisos({
    etapa: etapa || undefined, motivo: motivo || undefined, desde: desde || undefined, hasta: hasta || undefined,
    q: q || undefined, page, per_page: 25,
  });
  const filas = lista.data?.data ?? [];
  const meta = lista.data?.meta;
  const t = resumen.data?.totales;
  const meses = resumen.data?.por_mes ?? [];
  const maxMes = Math.max(1, ...meses.map((m) => m.dias));
  const actual = seleccion ?? filas[0] ?? null;

  useEffect(() => {
    if (!aviso || aviso.tipo === 'error') return undefined;
    const id = setTimeout(() => setAviso(null), 6000);
    return () => clearTimeout(id);
  }, [aviso]);

  return (
    <>
      <section className="glass flex flex-wrap items-end gap-4 px-6 py-5">
        <div className="flex-[1_1_320px]">
          <nav aria-label="Ruta" className="text-[13px] font-medium text-gris">Tiempo y ausencias › <span className="font-semibold text-tinta">Permisos</span></nav>
          <h1 className="mt-1 text-[28px] font-extrabold tracking-tight">Permisos</h1>
          <p className="mt-1 text-sm text-gris">Formato de autorización de permisos: el trabajador lo pide en la intranet, su jefe autoriza y RR.HH. aprueba.</p>
        </div>
        {puede('permisos.gestionar') && (
          <button type="button" className="btn btn-primary" onClick={() => setRegistrar(true)}><Icon name="mas" size={18} /> Registrar permiso</button>
        )}
      </section>

      <Aviso aviso={aviso} onCerrar={() => setAviso(null)} />

      <section aria-label="Indicadores" className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
        <Indicador titulo="Por aprobar RR.HH." valor={t?.pendiente_rrhh} detalle="Ya autorizados por el jefe" color="text-info" cargando={resumen.isPending}
          onClick={() => cambiar({ etapa: 'PENDIENTE_RRHH' })} activo={etapa === 'PENDIENTE_RRHH'} />
        <Indicador titulo="Esperan al jefe" valor={t?.pendiente_jefe} detalle="Pedidos sin autorizar" color="text-aviso" cargando={resumen.isPending}
          onClick={() => cambiar({ etapa: 'PENDIENTE_JEFE' })} activo={etapa === 'PENDIENTE_JEFE'} />
        <Indicador titulo="En curso hoy" valor={t?.en_curso} detalle="Personal con permiso hoy" cargando={resumen.isPending}
          onClick={() => cambiar({ etapa: 'EN_CURSO' })} activo={etapa === 'EN_CURSO'} />
        <Indicador titulo="Aprobados este mes" valor={t?.aprobadas_mes} detalle={`${numero(t?.dias_mes)} días · ${numero(t?.afectan_salario_mes)} sin goce`} cargando={resumen.isPending} />
        <div className="tile min-h-[124px]">
          <span className="label">Días aprobados por mes</span>
          <div className="mt-1 flex h-12 items-end gap-1" role="img" aria-label="Días de permiso aprobados en los últimos 12 meses">
            {meses.map((m) => (
              <span key={m.mes} className="flex-1 rounded-t-[3px] bg-info/60" title={`${periodoTexto(m.mes)}: ${m.aprobadas} permisos · ${m.dias} días`}
                style={{ height: `${(m.dias / maxMes) * 100}%`, minHeight: m.dias ? 3 : 0 }} />
            ))}
          </div>
          <span className="text-[13px] text-gris">Últimos 12 meses</span>
        </div>
      </section>

      <section className="glass flex flex-wrap items-end gap-3 px-5 py-4" aria-label="Filtros">
        <form className="flex flex-[2_1_280px] items-end gap-2" onSubmit={(e) => { e.preventDefault(); cambiar({ q: texto.trim() }); }}>
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="label">Trabajador</span>
            <input className="field" type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Nombre, DNI o código" />
          </label>
          <button type="submit" className="btn">Buscar</button>
        </form>
        <label className="flex flex-[1_1_180px] flex-col gap-1.5">
          <span className="label">Tipo de permiso</span>
          <select className="field" value={motivo} onChange={(e) => cambiar({ motivo: e.target.value })}>
            <option value="">Todos</option>
            {MOTIVOS.map((m) => <option key={m.valor} value={m.valor}>{m.texto}</option>)}
          </select>
        </label>
        <label className="flex flex-[1_1_150px] flex-col gap-1.5">
          <span className="label">Desde</span>
          <input className="field" type="date" value={desde} onChange={(e) => cambiar({ desde: e.target.value })} />
        </label>
        <label className="flex flex-[1_1_150px] flex-col gap-1.5">
          <span className="label">Hasta</span>
          <input className="field" type="date" min={desde || undefined} value={hasta} onChange={(e) => cambiar({ hasta: e.target.value })} />
        </label>
      </section>

      <div className="flex flex-wrap items-start gap-4">
        <section className="glass min-w-0 flex-[999_1_560px] py-2" aria-label="Solicitudes de permiso">
          <div className="overflow-x-auto px-5 pt-3 pb-3">
            <Segmentado etiqueta="Etapa" valor={etapa} onCambio={(v) => cambiar({ etapa: v })}
              opciones={PESTANAS.map((p) => ({ ...p, total: meta?.conteos?.[p.conteo] }))} />
          </div>
          {lista.isError && <p role="alert" className="px-5 py-3 text-sm font-semibold text-rojo-texto">{mensajeError(lista.error)}</p>}
          <div className="overflow-x-auto">
            <table className="tbl min-w-[760px]">
              <thead>
                <tr>
                  <th scope="col" className="pl-5!">Trabajador</th><th scope="col">Permiso</th><th scope="col">Fechas</th>
                  <th scope="col" className="text-right">Días</th><th scope="col" className="pr-5!">Estado</th>
                </tr>
              </thead>
              <tbody>
                {lista.isPending && [0, 1, 2].map((i) => <tr key={i}><td colSpan={5} className="px-5!"><span className="skeleton block h-6 w-full" /></td></tr>)}
                {!lista.isPending && filas.map((f) => {
                  const sel = actual && claveSolicitud(actual) === claveSolicitud(f);
                  return (
                    <tr key={claveSolicitud(f)} className={`cursor-pointer ${sel ? 'fila-sel' : ''}`} onClick={() => setSeleccion(f)}>
                      <td className="pl-5!">
                        <button type="button" className="text-left font-bold hover:text-rojo-texto hover:underline" onClick={(e) => { e.stopPropagation(); setSeleccion(f); }}>
                          {nombrePersona(f.nombre_completo)}
                        </button>
                        <div className="text-xs text-gris">{nombreEmpresa(f.empresa_nombre)} · cód. {f.cod_personal}</div>
                      </td>
                      <td className="text-[13px]">
                        {f.des_motivo}{f.des_otro_motivo ? `: ${f.des_otro_motivo}` : ''}
                        {f.afecta_salario === 'S' && <span className="badge badge-aviso ml-1.5 px-1.5! py-0! text-[10px]!">Sin goce</span>}
                        {f.docs_oblig_faltan > 0 && <div className="text-xs font-semibold text-rojo-texto">Falta documento obligatorio</div>}
                      </td>
                      <td className="text-[13px] tabular-nums">{fecha(f.fecha_inicio)} – {fecha(f.fecha_fin)}{horario(f) && <div className="text-xs text-gris">{horario(f)}</div>}</td>
                      <td className="text-right font-bold tabular-nums">{f.dias_solicitados}</td>
                      <td className="pr-5!">
                        <span className={`badge ${ETAPAS[f.etapa]?.clase ?? 'badge-neutro'}`}>{textoEtapa(f)}</span>
                        {f.etapa === 'PENDIENTE_JEFE' && !f.jefe_usuario && <div className="text-xs font-semibold text-aviso">Sin jefe en la intranet</div>}
                        {f.en_curso && <div className="text-xs text-info">En curso hoy</div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!lista.isPending && filas.length === 0 && <Vacio texto="No hay solicitudes con estos filtros." />}
          <Paginacion meta={meta} onPagina={(p) => cambiar({ page: p })} />
        </section>

        <PermisoDetalle key={actual ? claveSolicitud(actual) : 'nada'} seleccion={actual} onAviso={setAviso} />
      </div>

      {registrar && (
        <RegistrarPermisoModal onCerrar={() => setRegistrar(false)} onHecho={(m) => { setRegistrar(false); setAviso({ tipo: 'ok', texto: m }); }} />
      )}
    </>
  );
}
