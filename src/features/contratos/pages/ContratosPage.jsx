import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Icon from '../../../components/Icon';
import { Aviso, Indicador, Paginacion, Segmentado, Vacio } from '../../../components/ui';
import { mensajeError } from '../../../api/client';
import { useAuth } from '../../../context/AuthContext';
import { fecha, iniciales, moneda, nombreEmpresa, nombrePersona, numero } from '../../../lib/format';
import ContratoDetalle from '../components/ContratoDetalle';
import ContratoFormModal from '../components/ContratoFormModal';
import CerrarContratoModal from '../components/CerrarContratoModal';
import Semaforo from '../components/Semaforo';
import { PESTANAS, SITUACIONES, claveContrato, textoVencimiento } from '../constantes';
import { useContratos, useContratosResumen, useTiposContrato } from '../hooks/useContratos';

/** Filtros en la URL: se pueden compartir y la página de inicio enlaza directo a una pestaña. */
function useFiltros() {
  const [params, setParams] = useSearchParams();
  const filtros = {
    situacion: params.get('situacion') ?? 'EN_PROCESO',
    q: params.get('q') ?? '',
    tipo: params.get('tipo') ?? '',
    orden: params.get('orden') ?? 'vence',
    page: Number(params.get('page') ?? 1),
  };
  const cambiar = (cambios) => {
    const nuevo = { ...filtros, page: 1, ...cambios };
    const limpio = {};
    if (nuevo.situacion !== 'EN_PROCESO') limpio.situacion = nuevo.situacion;
    if (nuevo.q) limpio.q = nuevo.q;
    if (nuevo.tipo) limpio.tipo = nuevo.tipo;
    if (nuevo.orden !== 'vence') limpio.orden = nuevo.orden;
    if (nuevo.page > 1) limpio.page = String(nuevo.page);
    setParams(limpio, { replace: true });
  };
  return [filtros, cambiar];
}

function Barras({ meses = [] }) {
  const max = Math.max(1, ...meses.map((m) => m.total));
  const pico = meses.reduce((a, m) => (m.total > (a?.total ?? -1) ? m : a), null);
  return (
    <div className="tile min-h-[124px]">
      <span className="label">Contratos iniciados por mes</span>
      <div className="mt-1 flex h-12 items-end gap-1" role="img" aria-label={`Últimos 12 meses. Máximo ${pico?.total ?? 0} en ${pico?.mes ?? '—'}`}>
        {meses.map((m, i) => (
          <span
            key={m.mes}
            title={`${m.mes}: ${m.total}`}
            className={`flex-1 rounded-t-[4px] rounded-b-[2px] ${i === meses.length - 1 ? 'bg-rojo' : 'bg-gris/25'}`}
            style={{ height: `${Math.max(4, Math.round((m.total / max) * 100))}%` }}
          />
        ))}
      </div>
      <span className="text-[13px] text-gris">Últimos 12 meses · sin anulados</span>
    </div>
  );
}

export default function ContratosPage() {
  const { puede } = useAuth();
  const [filtros, cambiarFiltros] = useFiltros();
  const [busqueda, setBusqueda] = useState(filtros.q);
  const [seleccion, setSeleccion] = useState(null);
  const [modal, setModal] = useState(null); // { tipo, contrato }
  const [aviso, setAviso] = useState(null);

  const resumen = useContratosResumen();
  const lista = useContratos({
    situacion: filtros.situacion || undefined,
    q: filtros.q || undefined,
    tipo: filtros.tipo || undefined,
    orden: filtros.orden,
    page: filtros.page,
    per_page: 25,
  });
  const { data: tipos = [] } = useTiposContrato();

  const filas = useMemo(() => lista.data?.data ?? [], [lista.data]);
  const meta = lista.data?.meta;
  const conteos = meta?.conteos ?? {};
  const t = resumen.data?.totales;

  // Al cambiar filtros o página se vuelve a la primera fila de la nueva lista.
  const cambiar = (cambios) => {
    setSeleccion(null);
    cambiarFiltros(cambios);
  };

  // Sin elección explícita se muestra la primera fila de la página.
  const actual = seleccion ?? filas[0] ?? null;

  useEffect(() => {
    if (!aviso || aviso.tipo === 'error') return undefined;
    const id = setTimeout(() => setAviso(null), 6000);
    return () => clearTimeout(id);
  }, [aviso]);

  const terminar = (mensaje, dato) => {
    setModal(null);
    setAviso({ tipo: 'ok', texto: mensaje });
    if (dato?.cod_contrato && dato?.empresa) setSeleccion({ empresa: dato.empresa, cod_personal: dato.cod_personal, cod_contrato: dato.cod_contrato });
  };

  const pestañas = PESTANAS.map((p) => ({ ...p, total: conteos[p.conteo] }));

  return (
    <>
      <section className="glass flex flex-wrap items-end gap-4 px-6 py-5">
        <div className="flex-[1_1_320px]">
          <nav aria-label="Ruta" className="text-[13px] font-medium text-gris">Contratación › <span className="font-semibold text-tinta">Contratos</span></nav>
          <h1 className="mt-1 text-[28px] font-extrabold tracking-tight">Gestión de contratos</h1>
          <p className="mt-1 text-sm text-gris">Registro, renovación, cese y control de vencimientos de las empresas elegidas.</p>
        </div>
        {puede('contratos.gestionar') && (
          <button type="button" className="btn btn-primary" onClick={() => setModal({ tipo: 'nuevo' })}>
            <Icon name="mas" size={18} />
            Nuevo contrato
          </button>
        )}
      </section>

      <Aviso aviso={aviso} onCerrar={() => setAviso(null)} />

      <section aria-label="Indicadores" className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
        <Indicador titulo="En proceso" valor={t?.en_proceso} detalle={`${numero(t?.indeterminados)} indeterminados`} cargando={resumen.isPending}
          onClick={() => cambiar({ situacion: 'EN_PROCESO' })} activo={filtros.situacion === 'EN_PROCESO'} />
        <Indicador titulo="Vencen en 30 días" valor={t?.por_vencer} detalle={`${numero(t?.por_vencer_7)} en 7 días o menos`} color="text-aviso" acento="rgb(233 115 12 / 0.55)"
          cargando={resumen.isPending} onClick={() => cambiar({ situacion: 'POR_VENCER' })} activo={filtros.situacion === 'POR_VENCER'} />
        <Indicador titulo="Vencidos sin cerrar" valor={t?.vencidos_sin_cerrar} detalle="Renovar o registrar cese" color="text-rojo-texto" acento="rgb(177 26 26 / 0.55)"
          cargando={resumen.isPending} onClick={() => cambiar({ situacion: 'VENCIDO_SIN_CERRAR' })} activo={filtros.situacion === 'VENCIDO_SIN_CERRAR'} />
        <Indicador titulo="Por evaluar" valor={t?.por_evaluar} detalle="Por vencer y sin evaluación" color="text-info"
          cargando={resumen.isPending} onClick={() => cambiar({ situacion: 'POR_EVALUAR' })} activo={filtros.situacion === 'POR_EVALUAR'} />
        <Barras meses={resumen.data?.por_mes} />
      </section>

      <section className="glass flex flex-wrap items-end gap-3 px-5 py-4" aria-label="Filtros">
        <form
          className="flex flex-[2_1_320px] items-end gap-2"
          onSubmit={(e) => { e.preventDefault(); cambiar({ q: busqueda.trim() }); }}
        >
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="label">Trabajador</span>
            <input className="field" type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Nombre, DNI o código" />
          </label>
          <button type="submit" className="btn">Buscar</button>
        </form>
        <label className="flex flex-[1_1_180px] flex-col gap-1.5">
          <span className="label">Tipo de contrato</span>
          <select className="field" value={filtros.tipo} onChange={(e) => cambiar({ tipo: e.target.value })}>
            <option value="">Todos</option>
            {tipos.map((tp) => <option key={tp.tip_contrato} value={tp.tip_contrato}>{nombrePersona(tp.des_tipo_contrato)}</option>)}
          </select>
        </label>
        <label className="flex flex-[1_1_180px] flex-col gap-1.5">
          <span className="label">Ordenar por</span>
          <select className="field" value={filtros.orden} onChange={(e) => cambiar({ orden: e.target.value })}>
            <option value="vence">Vencimiento más próximo</option>
            <option value="nombre">Trabajador (A–Z)</option>
            <option value="empresa">Empresa</option>
            <option value="-inicio">Inicio más reciente</option>
          </select>
        </label>
        {(filtros.q || filtros.tipo) && (
          <button type="button" className="btn" onClick={() => { setBusqueda(''); cambiar({ q: '', tipo: '' }); }}>Limpiar</button>
        )}
      </section>

      <div className="flex flex-wrap items-start gap-4">
        <section className="glass min-w-0 flex-[999_1_620px] py-2" aria-label="Lista de contratos">
          <div className="flex flex-wrap items-center gap-3 px-5 pt-3 pb-3.5">
            <h2 className="text-[17px] font-extrabold">Contratos</h2>
            {lista.isFetching && !lista.isPending && <span className="text-xs text-gris">Actualizando…</span>}
          </div>
          <div className="overflow-x-auto px-5 pb-3">
            <Segmentado etiqueta="Filtrar por situación" opciones={pestañas} valor={filtros.situacion} onCambio={(v) => cambiar({ situacion: v })} />
          </div>

          {lista.isError && <p role="alert" className="px-5 py-4 text-sm font-semibold text-rojo-texto">{mensajeError(lista.error, 'No se pudo cargar la lista.')}</p>}

          <div className="overflow-x-auto">
            <table className="tbl min-w-[860px]">
              <thead>
                <tr>
                  <th scope="col" className="pl-5!">Trabajador</th>
                  <th scope="col">Empresa</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Período</th>
                  <th scope="col">Vencimiento</th>
                  <th scope="col" className="text-right">Sueldo</th>
                  <th scope="col" className="pr-5!">Estado del contrato</th>
                </tr>
              </thead>
              <tbody>
                {lista.isPending &&
                  [0, 1, 2, 3, 4].map((i) => (
                    <tr key={i}><td colSpan={7} className="px-5!"><span className="skeleton block h-6 w-full" /></td></tr>
                  ))}
                {!lista.isPending &&
                  filas.map((f) => {
                    const sel = actual && claveContrato(f) === claveContrato(actual);
                    const sit = SITUACIONES[f.situacion] ?? SITUACIONES.SIN_ESTADO;
                    const venc = textoVencimiento(f);
                    return (
                      <tr key={claveContrato(f)} className={sel ? 'fila-sel' : ''} onClick={() => setSeleccion(f)}>
                        <td className="pl-5!">
                          <div className="flex items-center gap-3">
                            <span className="avatar">{iniciales(nombrePersona(f.nombre_completo).replace(',', ''))}</span>
                            <div className="min-w-0">
                              <button type="button" className="text-left font-bold hover:text-rojo-texto hover:underline" aria-current={sel ? 'true' : undefined}
                                onClick={(e) => { e.stopPropagation(); setSeleccion(f); }}>
                                {nombrePersona(f.nombre_completo)}
                              </button>
                              <div className="truncate text-xs text-gris">{[f.cargo, f.area].filter(Boolean).map(nombrePersona).join(' · ') || `Cód. ${f.cod_personal}`}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className="count whitespace-nowrap" title={f.empresa_nombre}>{nombreEmpresa(f.empresa_nombre)}</span></td>
                        <td className="text-[13px]">{nombrePersona(f.des_tipo_contrato)}</td>
                        <td className="text-[13px] whitespace-nowrap tabular-nums">{fecha(f.fec_inicio)} – {fecha(f.fec_fin)}</td>
                        <td className={`text-[13px] font-semibold whitespace-nowrap ${venc.color}`}>
                          {venc.texto}
                          {f.por_evaluar && <span className="badge badge-info ml-2">Sin evaluar</span>}
                        </td>
                        <td className="text-right text-[13px] tabular-nums">{moneda(f.sueldo)}</td>
                        <td className="pr-5!">
                          <Semaforo contrato={f} />
                          <div className="mt-1 flex gap-1.5 text-[11px] font-semibold">
                            {f.estado !== 'P' && <span className={`badge ${sit.clase} px-2! py-0.5! text-[11px]!`}>{sit.texto}</span>}
                            {f.estado === 'P' && (f.tiene_archivo
                              ? <span className="text-ok">✓ Firmado cargado</span>
                              : <span className="text-gris">Sin contrato firmado</span>)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          {!lista.isPending && filas.length === 0 && <Vacio texto="No hay contratos con estos filtros." />}
          <Paginacion meta={meta} onPagina={(p) => cambiar({ page: p })} />
        </section>

        <ContratoDetalle seleccion={actual} onAccion={(tipo, contrato) => setModal({ tipo, contrato })} />
      </div>

      {modal && ['nuevo', 'renovar', 'editar'].includes(modal.tipo) && (
        <ContratoFormModal modo={modal.tipo} contrato={modal.contrato} onCerrar={() => setModal(null)} onHecho={terminar} />
      )}
      {modal && ['anular', 'cesar'].includes(modal.tipo) && (
        <CerrarContratoModal tipo={modal.tipo} contrato={modal.contrato} onCerrar={() => setModal(null)} onHecho={terminar} />
      )}
    </>
  );
}
