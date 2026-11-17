import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Indicador, Paginacion, Segmentado, Vacio } from '../../../components/ui';
import { mensajeError } from '../../../api/client';
import { fecha, iniciales, nombreEmpresa, nombrePersona, periodoTexto } from '../../../lib/format';
import { ESTADOS_EVALUACION, PESTANAS, textoRecomendacion } from '../constantes';
import { useEvaluaciones, useEvaluacionesResumen } from '../hooks/useEvaluaciones';

function useFiltros() {
  const [params, setParams] = useSearchParams();
  const filtros = {
    estado: params.get('estado') ?? '',
    q: params.get('q') ?? '',
    periodo: params.get('periodo') ?? '',
    orden: params.get('orden') ?? 'reciente',
    page: Number(params.get('page') ?? 1),
  };
  const cambiar = (cambios) => {
    const nuevo = { ...filtros, page: 1, ...cambios };
    const limpio = {};
    for (const [k, v] of Object.entries(nuevo)) {
      if (v && !(k === 'orden' && v === 'reciente') && !(k === 'page' && v === 1)) limpio[k] = String(v);
    }
    setParams(limpio, { replace: true });
  };
  return [filtros, cambiar];
}

/** Barra de puntaje: RR.HH. (gris oscuro) + Jefe (rojo) sobre el máximo del período. */
function BarraPuntaje({ f }) {
  const max = f.puntaje_max || 1;
  return (
    <div className="min-w-[120px]">
      <div className="flex items-baseline gap-1 text-sm">
        <span className="font-extrabold tabular-nums">{f.puntaje_total}</span>
        <span className="text-xs text-gris">/ {f.puntaje_max}</span>
      </div>
      <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-gris/15" role="img"
        aria-label={`RR.HH. ${f.puntaje_rh}, jefe ${f.puntaje_jefe}, de ${f.puntaje_max}`}>
        <span className="h-full bg-tinta-2" style={{ width: `${(f.puntaje_rh / max) * 100}%` }} />
        <span className="h-full bg-rojo" style={{ width: `${(f.puntaje_jefe / max) * 100}%` }} />
      </div>
    </div>
  );
}

const ESTADO_APROB = {
  A: { marca: '✓', texto: 'Aprobó', clase: 'text-ok' },
  R: { marca: '✕', texto: 'Rechazó', clase: 'text-rojo-texto' },
  P: { marca: '…', texto: 'Pendiente', clase: 'text-aviso' },
};

/** Cada aprobador con su estado: así se ve quién falta antes de generar el contrato. */
function Aprobadores({ f }) {
  const lista = f.aprobadores ?? [];
  if (!lista.length) {
    return <span className="text-gris">{f.estado === 'CERRADA' ? 'Sin aprobadores (cerrada)' : 'Sin aprobadores'}</span>;
  }
  return (
    <ul className="flex flex-col gap-0.5">
      {lista.map((a, i) => {
        const e = ESTADO_APROB[a.estado] ?? ESTADO_APROB.P;
        return (
          <li key={`${a.usuario}-${i}`} className="flex items-center gap-1.5 whitespace-nowrap" title={`${e.texto}${a.fecha ? ` el ${fecha(a.fecha)}` : ''}`}>
            <span className={`w-3 text-center font-extrabold ${e.clase}`} aria-hidden="true">{e.marca}</span>
            <span className="max-w-[150px] truncate">{nombrePersona(a.nombre ?? a.usuario)}</span>
            <span className="sr-only">: {e.texto}</span>
          </li>
        );
      })}
    </ul>
  );
}

export default function EvaluacionesPage() {
  const navigate = useNavigate();
  const [filtros, cambiar] = useFiltros();
  const [busqueda, setBusqueda] = useState(filtros.q);

  const resumen = useEvaluacionesResumen();
  const lista = useEvaluaciones({
    estado: filtros.estado || undefined,
    q: filtros.q || undefined,
    periodo: filtros.periodo || undefined,
    orden: filtros.orden,
    page: filtros.page,
    per_page: 25,
  });

  const t = resumen.data?.totales;
  const filas = lista.data?.data ?? [];
  const meta = lista.data?.meta;
  const pestañas = PESTANAS.map((p) => ({ ...p, total: meta?.conteos?.[p.conteo] }));
  const abrir = (f) => navigate(`/evaluaciones/${f.empresa}/${f.cod_personal}?periodo=${f.periodo}`);

  return (
    <>
      <section className="glass flex flex-wrap items-end gap-4 px-6 py-5">
        <div className="flex-[1_1_320px]">
          <nav aria-label="Ruta" className="text-[13px] font-medium text-gris">Contratación › <span className="font-semibold text-tinta">Evaluación de desempeño</span></nav>
          <h1 className="mt-1 text-[28px] font-extrabold tracking-tight">Evaluación para renovación</h1>
          <p className="mt-1 text-sm text-gris">Calificación de RR.HH. y del jefe, aprobaciones y renovación del contrato, por período.</p>
        </div>
        <Link to="/contratos?situacion=POR_EVALUAR" className="btn btn-primary">Iniciar evaluación</Link>
      </section>

      <section aria-label="Indicadores" className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
        <Indicador titulo="Por evaluar" valor={t?.por_evaluar} detalle="Contratos por vencer sin evaluación" color="text-info"
          cargando={resumen.isPending} onClick={() => navigate('/contratos?situacion=POR_EVALUAR')} />
        <Indicador titulo="En evaluación" valor={t?.en_proceso} detalle="Falta calificar RR.HH. o jefe" cargando={resumen.isPending}
          onClick={() => cambiar({ estado: 'EN_PROCESO' })} activo={filtros.estado === 'EN_PROCESO'} />
        <Indicador titulo="Pendientes de aprobación" valor={t?.pendiente_aprobacion} detalle="Esperan a los aprobadores" color="text-aviso"
          acento="rgb(233 115 12 / 0.55)" cargando={resumen.isPending}
          onClick={() => cambiar({ estado: 'PENDIENTE_APROBACION' })} activo={filtros.estado === 'PENDIENTE_APROBACION'} />
        <Indicador titulo="Por renovar" valor={t?.por_renovar} detalle="Aprobadas, falta generar el contrato" color="text-ok"
          acento="rgb(16 126 62 / 0.5)" cargando={resumen.isPending}
          onClick={() => cambiar({ estado: 'POR_RENOVAR' })} activo={filtros.estado === 'POR_RENOVAR'} />
        <Indicador titulo="Este mes" valor={t?.periodo_actual} detalle="Evaluaciones del período actual" cargando={resumen.isPending} />
      </section>

      <section className="glass flex flex-wrap items-end gap-3 px-5 py-4" aria-label="Filtros">
        <form className="flex flex-[2_1_320px] items-end gap-2" onSubmit={(e) => { e.preventDefault(); cambiar({ q: busqueda.trim() }); }}>
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="label">Trabajador</span>
            <input className="field" type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Nombre, DNI o código" />
          </label>
          <button type="submit" className="btn">Buscar</button>
        </form>
        <label className="flex flex-[1_1_170px] flex-col gap-1.5">
          <span className="label">Período</span>
          <input className="field" type="month" value={filtros.periodo} onChange={(e) => cambiar({ periodo: e.target.value })} />
        </label>
        <label className="flex flex-[1_1_180px] flex-col gap-1.5">
          <span className="label">Ordenar por</span>
          <select className="field" value={filtros.orden} onChange={(e) => cambiar({ orden: e.target.value })}>
            <option value="reciente">Actualización más reciente</option>
            <option value="vence">Vencimiento del contrato</option>
            <option value="nombre">Trabajador (A–Z)</option>
            <option value="-periodo">Período más reciente</option>
            <option value="-puntaje">Mayor puntaje</option>
          </select>
        </label>
        {(filtros.q || filtros.periodo) && (
          <button type="button" className="btn" onClick={() => { setBusqueda(''); cambiar({ q: '', periodo: '' }); }}>Limpiar</button>
        )}
      </section>

      <section className="glass min-w-0 py-2" aria-label="Lista de evaluaciones">
        <div className="flex flex-wrap items-center gap-3 px-5 pt-3 pb-3.5">
          <h2 className="text-[17px] font-extrabold">Evaluaciones</h2>
          {lista.isFetching && !lista.isPending && <span className="text-xs text-gris">Actualizando…</span>}
        </div>
        <div className="overflow-x-auto px-5 pb-3">
          <Segmentado etiqueta="Filtrar por estado" opciones={pestañas} valor={filtros.estado} onCambio={(v) => cambiar({ estado: v })} />
        </div>

        {lista.isError && <p role="alert" className="px-5 py-4 text-sm font-semibold text-rojo-texto">{mensajeError(lista.error, 'No se pudo cargar la lista.')}</p>}

        <div className="overflow-x-auto">
          <table className="tbl min-w-[940px]">
            <thead>
              <tr>
                <th scope="col" className="pl-5!">Trabajador</th>
                <th scope="col">Empresa</th>
                <th scope="col">Período</th>
                <th scope="col">Puntaje</th>
                <th scope="col">Jefe evaluador</th>
                <th scope="col">Aprobadores</th>
                <th scope="col">Recomienda</th>
                <th scope="col">Contrato vence</th>
                <th scope="col" className="pr-5!">Estado</th>
              </tr>
            </thead>
            <tbody>
              {lista.isPending &&
                [0, 1, 2, 3, 4].map((i) => (
                  <tr key={i}><td colSpan={9} className="px-5!"><span className="skeleton block h-6 w-full" /></td></tr>
                ))}
              {!lista.isPending &&
                filas.map((f) => {
                  const est = ESTADOS_EVALUACION[f.estado] ?? ESTADOS_EVALUACION.EN_PROCESO;
                  return (
                    <tr key={`${f.empresa}|${f.pe_id}|${f.periodo}`} className="cursor-pointer" onClick={() => abrir(f)}>
                      <td className="pl-5!">
                        <div className="flex items-center gap-3">
                          <span className="avatar">{iniciales(nombrePersona(f.nombre_completo).replace(',', ''))}</span>
                          <div className="min-w-0">
                            <Link to={`/evaluaciones/${f.empresa}/${f.cod_personal}?periodo=${f.periodo}`} className="font-bold hover:text-rojo-texto hover:underline"
                              onClick={(e) => e.stopPropagation()}>
                              {nombrePersona(f.nombre_completo)}
                            </Link>
                            <div className="truncate text-xs text-gris">{[f.cargo, f.area].filter(Boolean).map(nombrePersona).join(' · ')}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="count whitespace-nowrap">{nombreEmpresa(f.empresa_nombre)}</span></td>
                      <td className="text-[13px] font-semibold whitespace-nowrap capitalize">{periodoTexto(f.periodo)}</td>
                      <td><BarraPuntaje f={f} /></td>
                      <td className="text-[13px]">{f.jefe_nombre ? nombrePersona(f.jefe_nombre) : <span className="text-gris">Sin asignar</span>}</td>
                      <td className="text-[13px]"><Aprobadores f={f} /></td>
                      <td className="text-[13px] font-semibold whitespace-nowrap">{textoRecomendacion(f.recomendacion_final)}</td>
                      <td className="text-[13px] whitespace-nowrap tabular-nums">{f.contrato_fec_fin ? fecha(f.contrato_fec_fin) : '—'}</td>
                      <td className="pr-5!">
                        <span className={`badge ${est.clase}`}>{est.texto}</span>
                        {f.falta_seccion && <div className="mt-1 text-xs text-gris">Falta: {f.falta_seccion === 'RH_JEFE' ? 'RR.HH. y jefe' : f.falta_seccion === 'RH' ? 'RR.HH.' : 'jefe'}</div>}
                        {f.por_renovar && (
                          <Link to={`/evaluaciones/${f.empresa}/${f.cod_personal}?periodo=${f.periodo}`} onClick={(e) => e.stopPropagation()}
                            className="btn btn-sm btn-ok mt-1.5 min-h-[30px]! px-2.5! text-xs!">
                            Generar contrato
                          </Link>
                        )}
                        {f.estado === 'PENDIENTE_APROBACION' && f.aprob_pendientes > 0 && (
                          <div className="mt-1 text-xs text-gris">Falta{f.aprob_pendientes === 1 ? '' : 'n'} {f.aprob_pendientes} aprobador{f.aprob_pendientes === 1 ? '' : 'es'}</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        {!lista.isPending && filas.length === 0 && <Vacio texto="No hay evaluaciones con estos filtros." />}
        <Paginacion meta={meta} onPagina={(p) => cambiar({ page: p })} />
      </section>
    </>
  );
}
