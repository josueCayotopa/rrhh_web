import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Icon from '../../../components/Icon';
import { Aviso, Indicador, Paginacion, Segmentado, Vacio } from '../../../components/ui';
import { mensajeError } from '../../../api/client';
import { exportarLegajos } from '../../../api/endpoints/legajos';
import { useEmpresas } from '../../../context/EmpresaContext';
import { fecha, nombreEmpresa, nombrePersona, numero } from '../../../lib/format';
import BajaDocumentoModal from '../components/BajaDocumentoModal';
import CargarDocumentoModal from '../components/CargarDocumentoModal';
import LegajoDetalle from '../components/LegajoDetalle';
import { ESTADOS_PERSONAL } from '../constantes';
import { useLegajos, useLegajosPorVencer, useLegajosTotal, useTiposPlanilla } from '../hooks/useLegajos';

const VISTAS = [
  { valor: '', texto: 'Trabajadores' },
  { valor: 'pendientes', texto: 'Con pendientes' },
  { valor: 'vence', texto: 'Documentos por vencer' },
];

function Avance({ f }) {
  const pct = Number(f.porcentaje ?? 0);
  return (
    <div className="flex min-w-[130px] items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-tinta/[0.08]">
        <div className={`h-full rounded-full ${pct === 100 ? 'bg-ok' : pct >= 50 ? 'bg-aviso' : 'bg-rojo'}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-[54px] text-right text-[13px] font-semibold tabular-nums">{f.docs_req_cargados}/{f.docs_requeridos}</span>
    </div>
  );
}

export default function LegajosPage() {
  const { seleccionadas } = useEmpresas();
  const [params, setParams] = useSearchParams();
  const vista = params.get('vista') ?? '';
  const estado = params.get('estado') ?? 'AC';
  const planilla = params.get('planilla') ?? '';
  const q = params.get('q') ?? '';
  const orden = params.get('orden') ?? 'nombre';
  const page = Number(params.get('page') ?? 1);
  const [texto, setTexto] = useState(q);
  const [seleccion, setSeleccion] = useState(null);
  const [modal, setModal] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [exportando, setExportando] = useState(false);

  const cambiar = (c) => {
    const n = { vista, estado, planilla, q, orden, page: 1, ...c };
    const limpio = {};
    if (n.vista) limpio.vista = n.vista;
    if (n.estado !== 'AC') limpio.estado = n.estado;
    if (n.planilla) limpio.planilla = n.planilla;
    if (n.q) limpio.q = n.q;
    if (n.orden !== 'nombre') limpio.orden = n.orden;
    if (n.page > 1) limpio.page = String(n.page);
    setSeleccion(null);
    setParams(limpio, { replace: true });
  };

  const base = { estado: estado || undefined, tipo_planilla: planilla || undefined, q: q || undefined };
  const tipos = useTiposPlanilla();
  const total = useLegajosTotal(base);
  const pendientes = useLegajosTotal({ ...base, solo_pendientes: 1 });
  const vencen = useLegajosPorVencer({ ...base, incluir_vencidos: 1, dias: 30, page: vista === 'vence' ? page : 1, per_page: 25 });
  const lista = useLegajos({ ...base, solo_pendientes: vista === 'pendientes' ? 1 : undefined, orden, page, per_page: 25 });
  const filas = lista.data?.data ?? [];
  const actual = seleccion ?? (vista !== 'vence' ? filas[0] : vencen.data?.data?.[0]) ?? null;

  useEffect(() => {
    if (!aviso || aviso.tipo === 'error') return undefined;
    const id = setTimeout(() => setAviso(null), 6000);
    return () => clearTimeout(id);
  }, [aviso]);

  async function exportar() {
    setExportando(true);
    try {
      await exportarLegajos(seleccionadas, { ...base, solo_pendientes: vista === 'pendientes' ? 1 : undefined, orden });
    } catch (e) {
      setAviso({ tipo: 'error', texto: mensajeError(e, 'No se pudo exportar.') });
    } finally {
      setExportando(false);
    }
  }

  const esSel = (f) => actual && actual.empresa === f.empresa && actual.cod_personal === f.cod_personal;

  return (
    <>
      <section className="glass flex flex-wrap items-end gap-4 px-6 py-5">
        <div className="flex-[1_1_320px]">
          <nav aria-label="Ruta" className="text-[13px] font-medium text-gris">Documentos › <span className="font-semibold text-tinta">Legajo digital</span></nav>
          <h1 className="mt-1 text-[28px] font-extrabold tracking-tight">Legajo digital</h1>
          <p className="mt-1 text-sm text-gris">Documentos de cada trabajador por empresa: requeridos, cargados, versiones y vencimientos.</p>
        </div>
        <button type="button" className="btn" onClick={exportar} disabled={exportando}>
          <Icon name="abajo" size={16} /> {exportando ? 'Exportando…' : 'Exportar Excel'}
        </button>
      </section>

      <Aviso aviso={aviso} onCerrar={() => setAviso(null)} />

      <section aria-label="Indicadores" className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <Indicador titulo="Trabajadores" valor={total.data} detalle={estado === 'AC' ? 'Activos con legajo' : 'Con los filtros elegidos'} cargando={total.isPending}
          onClick={() => cambiar({ vista: '' })} activo={vista === ''} />
        <Indicador titulo="Con documentos pendientes" valor={pendientes.data} color="text-aviso" cargando={pendientes.isPending}
          detalle={total.data ? `${Math.round(((total.data - (pendientes.data ?? 0)) * 100) / total.data)}% tiene el legajo completo` : 'Falta algún requerido'}
          onClick={() => cambiar({ vista: 'pendientes' })} activo={vista === 'pendientes'} />
        <Indicador titulo="Por vencer o vencidos" valor={vencen.data?.meta?.total} detalle="Documentos en los próximos 30 días" color="text-rojo-texto" acento="rgb(177 26 26 / 0.55)"
          cargando={vencen.isPending} onClick={() => cambiar({ vista: 'vence' })} activo={vista === 'vence'} />
      </section>

      <section className="glass flex flex-wrap items-end gap-3 px-5 py-4" aria-label="Filtros">
        <form className="flex flex-[2_1_300px] items-end gap-2" onSubmit={(e) => { e.preventDefault(); cambiar({ q: texto.trim() }); }}>
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="label">Trabajador</span>
            <input className="field" type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Nombre, DNI o código" />
          </label>
          <button type="submit" className="btn">Buscar</button>
        </form>
        <label className="flex flex-[1_1_170px] flex-col gap-1.5">
          <span className="label">Tipo de planilla</span>
          <select className="field" value={planilla} onChange={(e) => cambiar({ planilla: e.target.value })}>
            <option value="">Todas</option>
            {(tipos.data ?? []).map((t) => <option key={t.cod_tipo_planilla} value={t.cod_tipo_planilla}>{nombrePersona(t.des_tipo_planilla)}</option>)}
          </select>
        </label>
        {vista !== 'vence' && (
          <label className="flex flex-[1_1_170px] flex-col gap-1.5">
            <span className="label">Ordenar por</span>
            <select className="field" value={orden} onChange={(e) => cambiar({ orden: e.target.value })}>
              <option value="nombre">Trabajador (A–Z)</option>
              <option value="porcentaje">Menor avance</option>
              <option value="-pendientes">Más pendientes</option>
              <option value="empresa">Empresa</option>
              <option value="-fec_ingreso">Ingreso más reciente</option>
            </select>
          </label>
        )}
        <div className="flex flex-col gap-1.5">
          <span className="label">Estado</span>
          <Segmentado etiqueta="Estado del trabajador" valor={estado} onCambio={(v) => cambiar({ estado: v })} opciones={ESTADOS_PERSONAL} />
        </div>
      </section>

      <div className="flex flex-wrap items-start gap-4">
        <section className="glass min-w-0 flex-[999_1_560px] py-2" aria-label="Legajos">
          <div className="overflow-x-auto px-5 pt-3 pb-3">
            <Segmentado etiqueta="Vista" valor={vista} onCambio={(v) => cambiar({ vista: v })}
              opciones={VISTAS.map((v) => ({ ...v, total: v.valor === '' ? total.data : v.valor === 'pendientes' ? pendientes.data : vencen.data?.meta?.total }))} />
          </div>

          {vista !== 'vence' ? (
            <>
              {lista.isError && <p role="alert" className="px-5 py-3 text-sm font-semibold text-rojo-texto">{mensajeError(lista.error)}</p>}
              <div className="overflow-x-auto">
                <table className="tbl min-w-[760px]">
                  <thead>
                    <tr>
                      <th scope="col" className="pl-5!">Trabajador</th><th scope="col">Empresa</th>
                      <th scope="col">Requeridos</th><th scope="col" className="text-right">Docs.</th>
                      <th scope="col">Alertas</th><th scope="col" className="pr-5!">Última carga</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lista.isPending && [0, 1, 2].map((i) => <tr key={i}><td colSpan={6} className="px-5!"><span className="skeleton block h-6 w-full" /></td></tr>)}
                    {!lista.isPending && filas.map((f) => (
                      <tr key={`${f.empresa}|${f.cod_personal}`} className={`cursor-pointer ${esSel(f) ? 'fila-sel' : ''}`} onClick={() => setSeleccion(f)}>
                        <td className="pl-5!">
                          <button type="button" className="text-left font-bold hover:text-rojo-texto hover:underline" onClick={(e) => { e.stopPropagation(); setSeleccion(f); }}>
                            {nombrePersona(f.nombre_completo)}
                          </button>
                          <div className="text-xs text-gris">
                            {f.dni ? `DNI ${f.dni} · ` : ''}cód. {f.cod_personal} · {nombrePersona(f.cargo ?? '')}
                            {f.tip_estado !== 'AC' && <span className="badge badge-neutro ml-1.5 px-1.5! py-0! text-[10px]!">{f.tip_estado === 'CE' ? 'Cesado' : 'Inactivo'}</span>}
                          </div>
                        </td>
                        <td><span className="count whitespace-nowrap">{nombreEmpresa(f.empresa_nombre)}</span></td>
                        <td><Avance f={f} /></td>
                        <td className="text-right tabular-nums">{numero(Number(f.docs_total))}</td>
                        <td className="text-[13px]">
                          {Number(f.docs_vencidos) > 0 && <span className="badge badge-error mr-1">{f.docs_vencidos} vencido{Number(f.docs_vencidos) > 1 ? 's' : ''}</span>}
                          {Number(f.docs_por_vencer) > 0 && <span className="badge badge-aviso">{f.docs_por_vencer} por vencer</span>}
                          {!Number(f.docs_vencidos) && !Number(f.docs_por_vencer) && <span className="text-gris">—</span>}
                        </td>
                        <td className="pr-5! text-[13px] tabular-nums">{fecha(f.ultima_carga)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!lista.isPending && filas.length === 0 && <Vacio texto="No hay legajos con estos filtros." />}
              <Paginacion meta={lista.data?.meta} onPagina={(p) => cambiar({ page: p })} />
            </>
          ) : (
            <>
              {vencen.isError && <p role="alert" className="px-5 py-3 text-sm font-semibold text-rojo-texto">{mensajeError(vencen.error)}</p>}
              <div className="overflow-x-auto">
                <table className="tbl min-w-[680px]">
                  <thead>
                    <tr>
                      <th scope="col" className="pl-5!">Trabajador</th><th scope="col">Empresa</th>
                      <th scope="col">Documento</th><th scope="col" className="pr-5!">Vence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vencen.isPending && [0, 1].map((i) => <tr key={i}><td colSpan={4} className="px-5!"><span className="skeleton block h-6 w-full" /></td></tr>)}
                    {!vencen.isPending && (vencen.data?.data ?? []).map((d) => {
                      const dias = Number(d.dias_restantes);
                      return (
                        <tr key={d.cod_legajo} className={`cursor-pointer ${esSel(d) ? 'fila-sel' : ''}`} onClick={() => setSeleccion(d)}>
                          <td className="pl-5! font-bold">{nombrePersona(d.nombre_completo)}<div className="text-xs font-normal text-gris">cód. {d.cod_personal}</div></td>
                          <td><span className="count whitespace-nowrap">{nombreEmpresa(d.empresa_nombre)}</span></td>
                          <td className="text-[13px]">{d.des_tipo_doc}</td>
                          <td className="pr-5! text-[13px] tabular-nums">
                            {fecha(d.fec_vencimiento)}
                            <div className={`text-xs font-semibold ${dias < 0 ? 'text-rojo-texto' : 'text-aviso'}`}>
                              {dias < 0 ? `Venció hace ${-dias} días` : dias === 0 ? 'Vence hoy' : `En ${dias} días`}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {!vencen.isPending && (vencen.data?.data ?? []).length === 0 && <Vacio texto="No hay documentos por vencer ni vencidos en los próximos 30 días." />}
              <Paginacion meta={vencen.data?.meta} onPagina={(p) => cambiar({ page: p })} />
            </>
          )}
        </section>

        <LegajoDetalle key={actual ? `${actual.empresa}|${actual.cod_personal}` : 'nadie'} seleccion={actual}
          onCargar={(m) => setModal({ tipo: 'cargar', ...m })} onBaja={(m) => setModal({ tipo: 'baja', ...m })} onAviso={setAviso} />
      </div>

      {modal?.tipo === 'cargar' && (
        <CargarDocumentoModal empresa={modal.empresa} codPersonal={modal.cod_personal} nombre={modal.nombre_completo} documento={modal.documento}
          onCerrar={() => setModal(null)} onHecho={(m) => { setModal(null); setAviso({ tipo: 'ok', texto: m }); }} />
      )}
      {modal?.tipo === 'baja' && (
        <BajaDocumentoModal empresa={modal.empresa} documento={modal.documento}
          onCerrar={() => setModal(null)} onHecho={(m) => { setModal(null); setAviso({ tipo: 'ok', texto: m }); }} />
      )}
    </>
  );
}
