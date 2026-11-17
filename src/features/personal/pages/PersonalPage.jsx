import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Indicador, Paginacion, Segmentado, Vacio } from '../../../components/ui';
import { mensajeError } from '../../../api/client';
import { fecha, nombreEmpresa, nombrePersona, numero, periodoTexto } from '../../../lib/format';
import Semaforo from '../../contratos/components/Semaforo';
import { contratoEnProceso, ESTADOS_LISTA, ESTADOS_PERSONAL, FILTROS, rutaFicha } from '../constantes';
import { usePersonal, usePersonalResumen } from '../hooks/usePersonal';

/** Jefe con su código de personal (y empresa si es de otra). */
function Jefe({ f }) {
  if (!f.jefe_usuario) return f.activo ? <span className="text-[13px] font-semibold text-aviso">Sin jefe</span> : <span className="text-gris">—</span>;
  return (
    <div className="text-[13px]">
      <div className="font-semibold">{nombrePersona(f.jefe_nombre ?? f.jefe_usuario)}</div>
      <div className="text-xs text-gris">
        {f.jefe_cod_personal ? `Cód. ${f.jefe_cod_personal}` : 'Sin código'}
        {f.jefe_empresa && f.jefe_empresa !== f.empresa ? ` · ${f.jefe_empresa}` : ''} · {f.jefe_usuario}
      </div>
    </div>
  );
}

export default function PersonalPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const estado = params.get('estado') ?? 'ACTIVO';
  const filtro = params.get('filtro') ?? '';
  const q = params.get('q') ?? '';
  const page = Number(params.get('page') ?? 1);
  const [texto, setTexto] = useState(q);

  const cambiar = (c) => {
    const n = { estado, filtro, q, page: 1, ...c };
    const limpio = {};
    if (n.estado !== 'ACTIVO') limpio.estado = n.estado;
    if (n.filtro) limpio.filtro = n.filtro;
    if (n.q) limpio.q = n.q;
    if (n.page > 1) limpio.page = String(n.page);
    setParams(limpio, { replace: true });
  };

  const resumen = usePersonalResumen();
  const lista = usePersonal({ estado, filtro: filtro || undefined, q: q || undefined, page, per_page: 25 });
  const filas = lista.data?.data ?? [];
  const meta = lista.data?.meta;
  const t = resumen.data?.totales;
  const p = resumen.data?.personas;
  const movimientos = resumen.data?.movimientos ?? [];
  const maxMov = Math.max(1, ...movimientos.map((m) => Math.max(m.ingresos, m.ceses)));
  const ultimo = movimientos[movimientos.length - 1];

  // Los filtros de revisión son sobre activos: al elegir uno se vuelve a "Activos".
  const filtrar = (v) => cambiar(v ? { filtro: filtro === v ? '' : v, estado: 'ACTIVO' } : { filtro: '' });

  return (
    <>
      <section className="glass flex flex-wrap items-end gap-4 px-6 py-5">
        <div className="flex-[1_1_320px]">
          <nav aria-label="Ruta" className="text-[13px] font-medium text-gris">Organización › <span className="font-semibold text-tinta">Personal</span></nav>
          <h1 className="mt-1 text-[28px] font-extrabold tracking-tight">Personal</h1>
          <p className="mt-1 text-sm text-gris">Una fila por persona (DNI) aunque trabaje en varias empresas del grupo, con el código de personal de cada una.</p>
        </div>
      </section>

      <section aria-label="Indicadores" className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
        <Indicador titulo="Personas activas" valor={p?.personas_activas} detalle={`${numero(p?.vinculos_activos)} vínculos con las empresas`} cargando={resumen.isPending}
          onClick={() => cambiar({ estado: 'ACTIVO', filtro: '' })} activo={estado === 'ACTIVO' && !filtro} />
        <Indicador titulo="En varias empresas" valor={p?.varias_empresas} detalle="Activas en más de una" color="text-info" cargando={resumen.isPending}
          onClick={() => filtrar('VARIAS_EMPRESAS')} activo={filtro === 'VARIAS_EMPRESAS'} />
        <Indicador titulo="Sin usuario intranet" valor={meta?.conteos?.sin_usuario ?? null} detalle="No pueden ver boletas ni pedir vacaciones" color="text-aviso" cargando={lista.isPending}
          onClick={() => filtrar('SIN_USUARIO')} activo={filtro === 'SIN_USUARIO'} />
        <Indicador titulo="Sin jefe" valor={meta?.conteos?.sin_jefe ?? null} detalle="Nadie aprueba sus solicitudes" color="text-aviso" cargando={lista.isPending}
          onClick={() => filtrar('SIN_JEFE')} activo={filtro === 'SIN_JEFE'} />
        <Indicador titulo="Contrato por vencer" valor={meta?.conteos?.por_vencer ?? null} detalle="O vencido sin cerrar" color="text-rojo-texto" acento="rgb(177 26 26 / 0.55)" cargando={lista.isPending}
          onClick={() => filtrar('POR_VENCER')} activo={filtro === 'POR_VENCER'} />
        <div className="tile min-h-[124px]">
          <span className="label">Ingresos y ceses</span>
          <div className="mt-1 flex h-12 items-end gap-1" role="img" aria-label="Ingresos y ceses de los últimos 12 meses">
            {movimientos.map((m) => (
              <span key={m.mes} className="flex h-full flex-1 items-end gap-px" title={`${periodoTexto(m.mes)}: ${m.ingresos} ingresos · ${m.ceses} ceses`}>
                <span className="flex-1 rounded-t-[2px] bg-ok/70" style={{ height: `${(m.ingresos / maxMov) * 100}%` }} />
                <span className="flex-1 rounded-t-[2px] bg-gris/45" style={{ height: `${(m.ceses / maxMov) * 100}%` }} />
              </span>
            ))}
          </div>
          <span className="text-[13px] text-gris">
            12 meses · verde ingresos · gris ceses{ultimo ? ` · este mes ${ultimo.ingresos}/${ultimo.ceses}` : ''}
          </span>
        </div>
      </section>

      <section className="glass flex flex-wrap items-end gap-3 px-5 py-4" aria-label="Filtros">
        <form className="flex flex-[2_1_320px] items-end gap-2" onSubmit={(e) => { e.preventDefault(); cambiar({ q: texto.trim() }); }}>
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="label">Trabajador</span>
            <input className="field" type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Nombre, DNI, código o usuario" />
          </label>
          <button type="submit" className="btn">Buscar</button>
        </form>
        <div className="flex flex-col gap-1.5">
          <span className="label">Estado</span>
          <Segmentado etiqueta="Estado del trabajador" valor={estado} onCambio={(v) => cambiar({ estado: v, filtro: v === 'ACTIVO' ? filtro : '' })}
            opciones={ESTADOS_LISTA.map((e) => ({ ...e, total: meta?.conteos?.[e.conteo] }))} />
        </div>
      </section>

      <section className="glass min-w-0 py-2" aria-label="Personal">
        <div className="overflow-x-auto px-5 pt-3 pb-3">
          <Segmentado etiqueta="Revisar" valor={filtro} onCambio={filtrar}
            opciones={FILTROS.map((f) => ({ ...f, total: f.conteo ? meta?.conteos?.[f.conteo] : undefined }))} />
        </div>
        {lista.isError && <p role="alert" className="px-5 py-3 text-sm font-semibold text-rojo-texto">{mensajeError(lista.error)}</p>}
        <div className="overflow-x-auto">
          <table className="tbl min-w-[980px]">
            <thead>
              <tr>
                <th scope="col" className="pl-5!">Trabajador</th>
                <th scope="col">Empresa · código</th>
                <th scope="col">Cargo y área</th>
                <th scope="col">Jefe</th>
                <th scope="col">Intranet</th>
                <th scope="col" className="pr-5!">Contrato</th>
              </tr>
            </thead>
            <tbody>
              {lista.isPending && [0, 1, 2].map((i) => <tr key={i}><td colSpan={6} className="px-5!"><span className="skeleton block h-6 w-full" /></td></tr>)}
              {!lista.isPending && filas.map((f) => {
                const abrir = () => navigate(rutaFicha(f.empresa, f.cod_personal));
                const contrato = contratoEnProceso(f);
                return (
                  <tr key={f.persona_key} className="cursor-pointer" onClick={abrir}>
                    <td className="pl-5!">
                      <button type="button" className="text-left font-bold hover:text-rojo-texto hover:underline" onClick={(e) => { e.stopPropagation(); abrir(); }}>
                        {nombrePersona(f.nombre_completo)}
                      </button>
                      <div className="text-xs text-gris">
                        {f.dni ? `DNI ${f.dni}` : 'Sin DNI'}
                        {!f.activo && <> · cesó {fecha(f.ultimo_cese)}</>}
                      </div>
                    </td>
                    <td>
                      <ul className="flex flex-col items-start gap-1">
                        {f.empresas_detalle.map((e) => (
                          <li key={`${e.empresa}|${e.cod_personal}`} className="flex items-center gap-1.5 whitespace-nowrap text-[13px]">
                            <span className={`count ${e.estado !== 'AC' ? 'opacity-60' : ''}`}>{nombreEmpresa(e.empresa_nombre)}</span>
                            <span className="font-mono text-xs font-semibold">{e.cod_personal}</span>
                            {e.estado !== 'AC' && <span className={`badge px-1.5! py-0! text-[10px]! ${ESTADOS_PERSONAL[e.estado]?.clase ?? 'badge-neutro'}`}>{ESTADOS_PERSONAL[e.estado]?.texto ?? e.estado}</span>}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="text-[13px]">
                      <div className="font-semibold">{nombrePersona(f.cargo ?? '') || '—'}</div>
                      <div className="text-xs text-gris">{[f.area, f.sede].filter(Boolean).map(nombrePersona).join(' · ')}</div>
                      <div className="text-xs text-gris">{f.des_tipo_planilla ? nombrePersona(f.des_tipo_planilla) : ''}{f.fec_ingreso ? ` · ingreso ${fecha(f.fec_ingreso)}` : ''}</div>
                    </td>
                    <td><Jefe f={f} /></td>
                    <td className="text-[13px]">
                      {f.usuario_intranet
                        ? <span className="font-mono font-semibold">{f.usuario_intranet}</span>
                        : f.activo ? <span className="font-semibold text-aviso">Sin usuario</span> : <span className="text-gris">—</span>}
                      {f.usuario_erp && f.usuario_erp !== f.usuario_intranet && <div className="text-xs text-gris">Sistema: {f.usuario_erp}</div>}
                    </td>
                    <td className="pr-5!">
                      {contrato ? <Semaforo contrato={contrato} />
                        : f.sin_contrato ? <span className="text-[13px] font-semibold text-rojo-texto">Sin contrato</span>
                          : <span className="text-[13px] text-gris">{f.activo ? 'No aplica' : '—'}</span>}
                      {f.contrato_fec_fin && f.situacion_contrato !== 'INDETERMINADO' && <div className="text-xs text-gris">fin {fecha(f.contrato_fec_fin)}</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!lista.isPending && filas.length === 0 && <Vacio texto="No hay personal con estos filtros." />}
        <Paginacion meta={meta} onPagina={(n) => cambiar({ page: n })} />
      </section>
    </>
  );
}
