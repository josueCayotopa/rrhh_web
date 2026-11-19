import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Icon from '../../../components/Icon';
import { Aviso, Indicador, Paginacion, Segmentado, Vacio } from '../../../components/ui';
import { mensajeError } from '../../../api/client';
import { exportarVisualizaciones, getVisualizaciones, getVisualizacionesResumen } from '../../../api/endpoints/boletas';
import { getTiposPlanilla } from '../../../api/endpoints/legajos';
import { useAuth } from '../../../context/AuthContext';
import { useEmpresas } from '../../../context/EmpresaContext';
import { fechaHora, nombreEmpresa, nombrePersona, numero, periodoTexto } from '../../../lib/format';

const CONFORMIDAD = [
  { valor: '', texto: 'Todas' },
  { valor: 'S', texto: 'Con conformidad' },
  { valor: 'N', texto: 'Sin conformidad' },
];

/** "Mozilla/5.0 (Linux; Android 10…) Chrome/…" → "Android · Chrome" */
function dispositivo(ua) {
  if (!ua) return '';
  const so = /Android/i.test(ua) ? 'Android' : /iPhone|iPad|iOS/i.test(ua) ? 'iOS' : /Windows/i.test(ua) ? 'Windows' : /Mac OS/i.test(ua) ? 'Mac' : /Linux/i.test(ua) ? 'Linux' : '';
  const nav = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : '';
  return [so, nav].filter(Boolean).join(' · ') || ua.slice(0, 40);
}

export default function BoletasPage() {
  const { puede } = useAuth();
  const { seleccionadas } = useEmpresas();
  const [params, setParams] = useSearchParams();
  const f = {
    periodo_desde: params.get('periodo_desde') ?? '',
    periodo_hasta: params.get('periodo_hasta') ?? '',
    vis_desde: params.get('vis_desde') ?? '',
    vis_hasta: params.get('vis_hasta') ?? '',
    tipo_planilla: params.get('tipo_planilla') ?? '',
    conforme: params.get('conforme') ?? '',
    q_personal: params.get('q_personal') ?? '',
    q_usuario: params.get('q_usuario') ?? '',
    orden: params.get('orden') ?? '-fecha',
  };
  const page = Number(params.get('page') ?? 1);
  const [borrador, setBorrador] = useState(f);
  const [aviso, setAviso] = useState(null);
  const [exportando, setExportando] = useState(false);

  const cambiar = (c) => {
    const n = { ...f, page: 1, ...c };
    const limpio = {};
    Object.entries(n).forEach(([k, v]) => { if (v && !(k === 'orden' && v === '-fecha') && !(k === 'page' && Number(v) === 1)) limpio[k] = String(v); });
    setParams(limpio, { replace: true });
  };

  // Solo los filtros con valor (las claves de TanStack Query comparan por contenido).
  const filtros = Object.fromEntries(Object.entries(f).filter(([, v]) => v));
  // El resumen por período no depende de la búsqueda, la conformidad ni el orden.
  const filtrosResumen = Object.fromEntries(Object.entries(filtros)
    .filter(([k]) => !['q_personal', 'q_usuario', 'conforme', 'orden'].includes(k)));

  const tipos = useQuery({ queryKey: ['catalogos', 'tipos-planilla'], queryFn: getTiposPlanilla, staleTime: 3600000 });
  const lista = useQuery({
    queryKey: ['boletas', 'lista', seleccionadas, filtros, page],
    queryFn: () => getVisualizaciones(seleccionadas, { ...filtros, page, per_page: 25 }),
    placeholderData: (previo) => previo,
  });
  const resumen = useQuery({
    queryKey: ['boletas', 'resumen', seleccionadas, filtrosResumen],
    queryFn: () => getVisualizacionesResumen(seleccionadas, filtrosResumen),
    placeholderData: (previo) => previo,
  });

  const filas = lista.data?.data ?? [];
  const porPeriodo = resumen.data ?? [];
  const totales = porPeriodo.reduce((t, r) => ({
    vis: t.vis + Number(r.visualizaciones), trab: t.trab + Number(r.trabajadores), conf: t.conf + Number(r.conformes),
  }), { vis: 0, trab: 0, conf: 0 });
  const ultimo = porPeriodo.length ? Math.max(...porPeriodo.map((r) => Number(r.periodo))) : null;
  const delUltimo = porPeriodo.filter((r) => Number(r.periodo) === ultimo);

  async function exportar() {
    setExportando(true);
    try {
      await exportarVisualizaciones(seleccionadas, filtros);
    } catch (e) {
      setAviso({ tipo: 'error', texto: mensajeError(e, 'No se pudo exportar.') });
    } finally {
      setExportando(false);
    }
  }

  const campo = (k) => ({ value: borrador[k], onChange: (e) => setBorrador({ ...borrador, [k]: e.target.value }) });

  return (
    <>
      <section className="glass flex flex-wrap items-end gap-4 px-6 py-5">
        <div className="flex-[1_1_320px]">
          <nav aria-label="Ruta" className="text-[13px] font-medium text-gris">Documentos › <span className="font-semibold text-tinta">Visualización de boletas</span></nav>
          <h1 className="mt-1 text-[28px] font-extrabold tracking-tight">Visualización de boletas</h1>
          <p className="mt-1 text-sm text-gris">Quién abrió su boleta en la intranet, cuándo, desde qué dispositivo y si dio su conformidad.</p>
        </div>
        {puede('boletas_vis.exportar') && (
          <button type="button" className="btn" onClick={exportar} disabled={exportando}>
            <Icon name="abajo" size={16} /> {exportando ? 'Exportando…' : 'Exportar Excel'}
          </button>
        )}
      </section>

      <Aviso aviso={aviso} onCerrar={() => setAviso(null)} />

      <section aria-label="Indicadores" className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <Indicador titulo="Visualizaciones" valor={totales.vis} detalle={`${porPeriodo.length ? new Set(porPeriodo.map((r) => r.periodo)).size : 0} períodos`} cargando={resumen.isPending} />
        <Indicador titulo={ultimo ? `Trabajadores · ${periodoTexto(ultimo)}` : 'Último período'} valor={delUltimo.reduce((s, r) => s + Number(r.trabajadores), 0)}
          detalle="Abrieron la boleta del último período" color="text-info" cargando={resumen.isPending}
          onClick={ultimo ? () => { const p = `${Math.floor(ultimo / 100)}-${String(ultimo % 100).padStart(2, '0')}`; setBorrador({ ...borrador, periodo_desde: p, periodo_hasta: p }); cambiar({ periodo_desde: p, periodo_hasta: p }); } : undefined} />
        <Indicador titulo="Con conformidad" valor={totales.conf} detalle={totales.vis ? `${Math.round((totales.conf * 100) / totales.vis)}% de las visualizaciones` : 'Firmaron conforme'}
          color="text-ok" cargando={resumen.isPending} onClick={() => cambiar({ conforme: f.conforme === 'S' ? '' : 'S' })} activo={f.conforme === 'S'} />
      </section>

      <form className="glass flex flex-wrap items-end gap-3 px-5 py-4" aria-label="Filtros" onSubmit={(e) => { e.preventDefault(); cambiar({ ...borrador, conforme: f.conforme, orden: f.orden }); }}>
        <label className="flex flex-[2_1_220px] flex-col gap-1.5">
          <span className="label">Trabajador</span>
          <input className="field" type="search" placeholder="Nombre, DNI o código" {...campo('q_personal')} />
        </label>
        <label className="flex flex-[1_1_140px] flex-col gap-1.5">
          <span className="label">Usuario</span>
          <input className="field" type="search" placeholder="Login" {...campo('q_usuario')} />
        </label>
        <label className="flex flex-[1_1_150px] flex-col gap-1.5">
          <span className="label">Período desde</span>
          <input className="field" type="month" {...campo('periodo_desde')} />
        </label>
        <label className="flex flex-[1_1_150px] flex-col gap-1.5">
          <span className="label">Período hasta</span>
          <input className="field" type="month" {...campo('periodo_hasta')} />
        </label>
        <label className="flex flex-[1_1_150px] flex-col gap-1.5">
          <span className="label">Visto desde</span>
          <input className="field" type="date" {...campo('vis_desde')} />
        </label>
        <label className="flex flex-[1_1_150px] flex-col gap-1.5">
          <span className="label">Visto hasta</span>
          <input className="field" type="date" min={borrador.vis_desde || undefined} {...campo('vis_hasta')} />
        </label>
        <label className="flex flex-[1_1_160px] flex-col gap-1.5">
          <span className="label">Tipo de planilla</span>
          <select className="field" {...campo('tipo_planilla')}>
            <option value="">Todas</option>
            {(tipos.data ?? []).map((t) => <option key={t.cod_tipo_planilla} value={t.cod_tipo_planilla}>{nombrePersona(t.des_tipo_planilla)}</option>)}
          </select>
        </label>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary">Filtrar</button>
          <button type="button" className="btn" onClick={() => { const v = Object.fromEntries(Object.keys(f).map((k) => [k, k === 'orden' ? '-fecha' : ''])); setBorrador(v); setParams({}, { replace: true }); }}>Limpiar</button>
        </div>
      </form>

      <div className="flex flex-wrap items-start gap-4">
        <section className="glass min-w-0 flex-[999_1_600px] py-2" aria-label="Visualizaciones">
          <div className="flex flex-wrap items-center gap-3 overflow-x-auto px-5 pt-3 pb-3">
            <Segmentado etiqueta="Conformidad" valor={f.conforme} onCambio={(v) => cambiar({ conforme: v })} opciones={CONFORMIDAD} />
            <label className="ml-auto flex items-center gap-2 text-[13px]">
              <span className="text-gris">Ordenar</span>
              <select className="field min-h-[36px]! py-1!" value={f.orden} onChange={(e) => cambiar({ orden: e.target.value })}>
                <option value="-fecha">Más recientes</option>
                <option value="fecha">Más antiguas</option>
                <option value="nombre">Trabajador (A–Z)</option>
                <option value="-periodo">Período</option>
                <option value="empresa">Empresa</option>
              </select>
            </label>
          </div>
          {lista.isError && <p role="alert" className="px-5 py-3 text-sm font-semibold text-rojo-texto">{mensajeError(lista.error)}</p>}
          <div className="overflow-x-auto">
            <table className="tbl min-w-[860px]">
              <thead>
                <tr>
                  <th scope="col" className="pl-5!">Trabajador</th><th scope="col">Empresa</th><th scope="col">Boleta</th>
                  <th scope="col">Visto</th><th scope="col">Dispositivo</th><th scope="col" className="pr-5!">Conformidad</th>
                </tr>
              </thead>
              <tbody>
                {lista.isPending && [0, 1, 2].map((i) => <tr key={i}><td colSpan={6} className="px-5!"><span className="skeleton block h-6 w-full" /></td></tr>)}
                {!lista.isPending && filas.map((v) => (
                  <tr key={`${v.empresa}|${v.id}`}>
                    <td className="pl-5!">
                      <div className="font-bold">{nombrePersona(v.nombre_completo ?? v.cod_usuario)}</div>
                      <div className="text-xs text-gris">{v.dni ? `DNI ${v.dni} · ` : ''}cód. {v.cod_personal} · {v.cod_usuario}</div>
                    </td>
                    <td><span className="count whitespace-nowrap">{nombreEmpresa(v.empresa_nombre)}</span></td>
                    <td className="text-[13px]">
                      <div className="font-semibold">{periodoTexto(Number(v.periodo))}</div>
                      <div className="text-xs text-gris">{nombrePersona(v.tip_boleta ?? '')}{v.des_tipo_planilla ? ` · ${nombrePersona(v.des_tipo_planilla)}` : ''}</div>
                    </td>
                    <td className="text-[13px] tabular-nums">{fechaHora(v.fec_visualizacion)}</td>
                    <td className="text-[13px]" title={v.des_dispositivo ?? ''}>
                      {dispositivo(v.des_dispositivo)}
                      <div className="text-xs text-gris">{v.des_ip}{v.des_plataforma ? ` · ${v.des_plataforma}` : ''}</div>
                    </td>
                    <td className="pr-5! text-[13px]">
                      {v.ind_firma_conforme === 'S'
                        ? <><span className="badge badge-ok">Conforme</span><div className="text-xs text-gris">{fechaHora(v.fec_firma_conforme)}</div></>
                        : <span className="text-gris">Sin conformidad</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!lista.isPending && filas.length === 0 && <Vacio texto="No hay visualizaciones con estos filtros." />}
          <Paginacion meta={lista.data?.meta} onPagina={(p) => cambiar({ page: p })} />
        </section>

        <aside className="glass flex min-w-0 flex-[1_1_320px] flex-col gap-3 p-5" aria-label="Resumen por período">
          <h2 className="text-[16px] font-extrabold">Por período y empresa</h2>
          {resumen.isPending && <span className="skeleton h-40 w-full" />}
          {!resumen.isPending && porPeriodo.length === 0 && <p className="text-sm text-gris">Sin datos.</p>}
          <div className="-mx-5 max-h-[560px] overflow-y-auto">
            <table className="tbl">
              <thead>
                <tr><th scope="col" className="pl-5!">Período</th><th scope="col" className="text-right">Trab.</th><th scope="col" className="pr-5! text-right">Conf.</th></tr>
              </thead>
              <tbody>
                {porPeriodo.map((r) => (
                  <tr key={`${r.empresa}|${r.periodo}`}>
                    <td className="pl-5! text-[13px]">
                      <span className="font-semibold">{periodoTexto(Number(r.periodo))}</span>
                      <div className="text-xs text-gris">{nombreEmpresa(r.empresa_nombre)}</div>
                    </td>
                    <td className="text-right tabular-nums" title={`${r.visualizaciones} visualizaciones`}>{numero(Number(r.trabajadores))}</td>
                    <td className="pr-5! text-right tabular-nums">{numero(Number(r.conformes))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </aside>
      </div>
    </>
  );
}
