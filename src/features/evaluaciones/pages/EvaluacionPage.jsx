import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Icon from '../../../components/Icon';
import Modal from '../../../components/Modal';
import { Aviso, Campo, Dato, ErrorForm } from '../../../components/ui';
import { mensajeError } from '../../../api/client';
import { anularEvaluacion, guardarEvaluacion, imprimirEvaluacion } from '../../../api/endpoints/evaluaciones';
import { useAuth } from '../../../context/AuthContext';
import { fecha, iniciales, moneda, nombreEmpresa, nombrePersona, periodoInput, periodoTexto } from '../../../lib/format';
import Aprobaciones from '../components/Aprobaciones';
import RenovarModal from '../components/RenovarModal';
import SeccionCriterios from '../components/SeccionCriterios';
import { ESTADOS_EVALUACION, RECOMENDACIONES, SECCIONES, TIPOS_CONTRATO_EVAL, textoRecomendacion } from '../constantes';
import { useAccionEvaluacion, useEvaluacion, useUsuariosEvaluacion } from '../hooks/useEvaluaciones';

const puntajesIniciales = (criterios) =>
  Object.fromEntries(
    criterios
      .filter((c) => c.puntaje !== null && c.puntaje !== undefined)
      .map((c) => [c.criterio_id, { puntaje: c.puntaje, observacion: c.observacion ?? '' }]),
  );

/** Pasos del proceso, calculados con el estado real del período. */
function Flujo({ cab, rhOk, jefeOk }) {
  const pasos = [
    { t: 'Evaluación RR.HH.', d: rhOk ? 'Completa' : 'Pendiente', ok: rhOk },
    { t: 'Evaluación del jefe', d: jefeOk ? 'Completa' : cab.jefe_nombre ? nombrePersona(cab.jefe_nombre) : 'Sin jefe asignado', ok: jefeOk },
    {
      t: 'Aprobadores',
      d: cab.aprob_total ? `${cab.aprob_aprobadas} de ${cab.aprob_total}${cab.aprob_rechazadas ? ' · rechazada' : ''}` : 'Sin aprobadores',
      ok: rhOk && jefeOk && cab.aprob_pendientes === 0 && cab.aprob_rechazadas === 0,
      error: cab.aprob_rechazadas > 0,
    },
    { t: 'Renovación', d: cab.genero_contrato ? `Contrato N° ${cab.cod_contrato_nuevo}` : 'Pendiente', ok: cab.genero_contrato },
  ];
  const actual = pasos.findIndex((p) => !p.ok);

  return (
    <ol aria-label="Flujo de la evaluación" className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-2">
      {pasos.map((p, i) => {
        const estilo = p.error ? 'border-rojo/40 bg-rojo/5' : p.ok ? 'border-ok/25 bg-ok/5' : i === actual ? 'border-rojo bg-white' : 'border-linea bg-white/50';
        return (
          <li key={p.t} className={`flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 ${estilo}`} aria-current={i === actual ? 'step' : undefined}>
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${p.ok ? 'bg-ok text-white' : i === actual ? 'bg-rojo text-white' : 'bg-gris/15 text-tinta-2'}`}>
              {p.ok ? <Icon name="check" size={14} /> : i + 1}
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-bold">{p.t}</span>
              <span className="block truncate text-xs text-gris">{p.d}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Anillo({ total, maximo }) {
  const pct = maximo ? Math.round((total / maximo) * 100) : 0;
  return (
    <div
      role="img"
      aria-label={`Puntaje ${total} de ${maximo}`}
      className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
      style={{ background: `conic-gradient(#B11A1A ${pct * 3.6}deg, rgb(92 90 91 / 0.14) 0deg)` }}
    >
      <div className="flex h-[88px] w-[88px] flex-col items-center justify-center rounded-full bg-white">
        <span className="text-[28px] leading-none font-extrabold tabular-nums">{total}</span>
        <span className="text-xs text-gris">de {maximo}</span>
      </div>
    </div>
  );
}

function Formulario({ datos, empresa, codPersonal, onAviso }) {
  const navigate = useNavigate();
  const [, setParams] = useSearchParams();
  const { puede } = useAuth();
  const cab = { ...datos.cabecera, empresa };
  const gestionar = puede('evaluaciones.gestionar');
  const bloqueada = !gestionar || cab.genero_contrato;
  const { data: usuarios = [] } = useUsuariosEvaluacion(gestionar ? empresa : null);

  const porSeccion = useMemo(() => ({
    RH: datos.criterios.filter((c) => c.categoria === 'RH'),
    JEFE: datos.criterios.filter((c) => c.categoria === 'JEFE'),
  }), [datos.criterios]);

  const [puntajes, setPuntajes] = useState(() => puntajesIniciales(datos.criterios));
  const [trabajador, setTrabajador] = useState({
    fecha_ingreso: cab.fecha_ingreso ?? cab.fec_ingreso_planilla ?? '',
    tipo_contrato: cab.tipo_contrato ?? 'A MODALIDAD',
    fecha_termino: cab.fecha_termino ?? cab.contrato_fec_fin ?? '',
    area_puesto: cab.area_puesto ?? [cab.area, cab.cargo].filter(Boolean).join(' / '),
  });
  const [jefe, setJefe] = useState(cab.jefe_id ? String(cab.jefe_id) : '');
  const [nuevosAprobadores, setNuevosAprobadores] = useState([]);
  const [recomendacion, setRecomendacion] = useState(cab.recomendacion_final ?? '');
  const [justificacion, setJustificacion] = useState('');
  const [recomendaciones, setRecomendaciones] = useState(cab.recomendaciones ?? '');
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);

  const guardar = useAccionEvaluacion((cuerpo) => guardarEvaluacion(empresa, codPersonal, cab.periodo, cuerpo));
  const anular = useAccionEvaluacion(() => anularEvaluacion(empresa, codPersonal, cab.periodo));

  // Una sección se exige si el período es nuevo o si ya existe su fila / sus puntajes.
  const requerida = (cat) =>
    !cab.existe || (cat === 'RH' ? cab.eval_id_rh : cab.eval_id_jefe) !== null || porSeccion[cat].some((c) => c.puntaje !== null);
  const completa = (cat) => porSeccion[cat].every((c) => puntajes[c.criterio_id]?.puntaje !== undefined);
  const rhOk = cab.existe && !['RH', 'RH_JEFE'].includes(cab.falta_seccion);
  const jefeOk = cab.existe && !['JEFE', 'RH_JEFE'].includes(cab.falta_seccion);

  const suma = (lista) => lista.reduce((s, c) => s + (puntajes[c.criterio_id]?.puntaje ?? 0) * c.peso, 0);
  const maximo = (lista) => lista.reduce((s, c) => s + c.escala_max * c.peso, 0);
  const totalRh = suma(porSeccion.RH);
  const totalJefe = suma(porSeccion.JEFE);
  const maxRh = maximo(porSeccion.RH);
  const maxJefe = maximo(porSeccion.JEFE);

  const estado = ESTADOS_EVALUACION[cab.estado] ?? ESTADOS_EVALUACION.NUEVA;
  const puedeRenovar = gestionar && ['APROBADA', 'CERRADA'].includes(cab.estado) && !cab.genero_contrato && cab.recomendacion_final && cab.recomendacion_final !== 'NO' && cab.contrato_cod;
  const yaAsignados = new Set(datos.aprobaciones.map((a) => a.usuario_id));
  const jefes = usuarios.filter((u) => u.es_jefe);
  const aprobadoresPosibles = usuarios.filter((u) => u.es_aprobador && !yaAsignados.has(u.usuario_id) && !nuevosAprobadores.includes(u.usuario_id));

  function enviar(e) {
    e.preventDefault();
    setError('');

    const lista = [];
    for (const cat of ['RH', 'JEFE']) {
      const calificados = porSeccion[cat].filter((c) => puntajes[c.criterio_id]?.puntaje !== undefined);
      if (calificados.length && calificados.length < porSeccion[cat].length) {
        setError(`Complete todos los criterios de "${SECCIONES[cat].titulo}" o déjela sin calificar.`);
        return;
      }
      calificados.forEach((c) => lista.push({ criterio_id: c.criterio_id, puntaje: puntajes[c.criterio_id].puntaje, observacion: puntajes[c.criterio_id].observacion?.trim() || null }));
    }
    if (recomendacion === 'NO' && !justificacion.trim() && !cab.justificacion) {
      setError('Explique por qué no se recomienda la renovación.');
      return;
    }

    guardar.mutate(
      {
        ...trabajador,
        fecha_ingreso: trabajador.fecha_ingreso || null,
        fecha_termino: trabajador.fecha_termino || null,
        jefe_asignado: jefe ? Number(jefe) : null,
        aprobadores: nuevosAprobadores,
        puntajes: lista,
        recomendaciones: recomendaciones.trim() || null,
        recomendacion_final: recomendacion || null,
        justificacion: justificacion.trim() || null,
      },
      {
        onSuccess: (r) => {
          setNuevosAprobadores([]);
          onAviso({ tipo: 'ok', texto: r.message });
          if (!cab.existe) setParams({ periodo: String(cab.periodo) }, { replace: true });
        },
        onError: (err) => setError(mensajeError(err, 'No se pudo guardar la evaluación.')),
      },
    );
  }

  return (
    <>
      <section className="glass px-6 py-5">
        <nav aria-label="Ruta" className="text-[13px] font-medium text-gris">
          <Link to="/evaluaciones" className="hover:text-rojo-texto hover:underline">Evaluación de desempeño</Link> ›{' '}
          <span className="font-semibold text-tinta capitalize">{periodoTexto(cab.periodo)}</span>
        </nav>
        <div className="mt-2.5 flex flex-wrap items-center gap-3.5">
          <span className="avatar h-14! w-14! text-lg!">{iniciales(nombrePersona(cab.nombre_completo).replace(',', ''))}</span>
          <div className="min-w-0 flex-[1_1_280px]">
            <h1 className="text-2xl leading-tight font-extrabold tracking-tight">{nombrePersona(cab.nombre_completo)}</h1>
            <p className="text-sm text-gris">{[cab.cargo, cab.area].filter(Boolean).map(nombrePersona).join(' · ')} · {nombreEmpresa(cab.empresa_nombre)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`badge ${estado.clase}`}>{estado.texto}</span>
            {cab.contrato_fec_fin && cab.contrato_fec_fin < '2050-01-01' && (
              <span className="badge badge-aviso">Contrato vence {fecha(cab.contrato_fec_fin)}</span>
            )}
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-4">
          <Dato etiqueta="Contrato en proceso">{cab.contrato_cod ? `N° ${cab.contrato_cod} · ${fecha(cab.contrato_fec_inicio)} – ${fecha(cab.contrato_fec_fin)}` : 'Sin contrato en proceso'}</Dato>
          <Dato etiqueta="Sueldo">{moneda(cab.contrato_sueldo)}</Dato>
          <Dato etiqueta="Jefe evaluador">{cab.jefe_nombre ? nombrePersona(cab.jefe_nombre) : 'Sin asignar'}</Dato>
          <div>
            <label htmlFor="periodo" className="label">Período</label>
            <div className="mt-1 flex gap-2">
              <select id="periodo" className="field min-h-[38px]!" value={cab.periodo}
                onChange={(e) => setParams({ periodo: e.target.value })}>
                {!datos.periodos.some((p) => p.periodo === cab.periodo) && <option value={cab.periodo}>{periodoTexto(cab.periodo)} (nuevo)</option>}
                {datos.periodos.map((p) => (
                  <option key={p.periodo} value={p.periodo}>{periodoTexto(p.periodo)} · {ESTADOS_EVALUACION[p.estado]?.texto ?? p.estado}</option>
                ))}
              </select>
              {gestionar && (
                <input type="month" aria-label="Evaluar otro período" className="field min-h-[38px]! w-[150px]!" value={periodoInput(cab.periodo)}
                  onChange={(e) => e.target.value && setParams({ periodo: e.target.value.replace('-', '') })} />
              )}
            </div>
          </div>
        </dl>
        <Flujo cab={cab} rhOk={rhOk} jefeOk={jefeOk} />
      </section>

      {cab.genero_contrato && (
        <p className="glass px-5 py-3.5 text-sm font-semibold text-ok" role="status">
          Este período ya generó el contrato N° {cab.cod_contrato_nuevo}. La evaluación queda solo para consulta.
        </p>
      )}

      <form onSubmit={enviar} className="flex flex-wrap items-start gap-4">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
          {!cab.existe && (
            <section className="glass px-6 py-5" aria-labelledby="sec-datos">
              <h2 id="sec-datos" className="text-[17px] font-extrabold">Datos del trabajador para la evaluación</h2>
              <p className="mt-1 text-sm text-gris">Se precargan desde la planilla y el contrato en proceso.</p>
              <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
                <Campo etiqueta="Fecha de ingreso">
                  <input className="field" type="date" value={trabajador.fecha_ingreso} disabled={bloqueada} required
                    onChange={(e) => setTrabajador((t) => ({ ...t, fecha_ingreso: e.target.value }))} />
                </Campo>
                <Campo etiqueta="Tipo de contrato">
                  <select className="field" value={trabajador.tipo_contrato} disabled={bloqueada}
                    onChange={(e) => setTrabajador((t) => ({ ...t, tipo_contrato: e.target.value }))}>
                    {TIPOS_CONTRATO_EVAL.map((t) => <option key={t} value={t}>{nombrePersona(t)}</option>)}
                  </select>
                </Campo>
                <Campo etiqueta="Término del contrato">
                  <input className="field" type="date" value={trabajador.fecha_termino} disabled={bloqueada}
                    onChange={(e) => setTrabajador((t) => ({ ...t, fecha_termino: e.target.value }))} />
                </Campo>
                <Campo etiqueta="Área / puesto">
                  <input className="field" maxLength={400} value={trabajador.area_puesto} disabled={bloqueada}
                    onChange={(e) => setTrabajador((t) => ({ ...t, area_puesto: e.target.value }))} />
                </Campo>
              </div>
            </section>
          )}

          {['RH', 'JEFE'].map((cat) => (
            <SeccionCriterios
              key={cat}
              categoria={cat}
              criterios={porSeccion[cat]}
              puntajes={puntajes}
              bloqueada={bloqueada}
              requerida={requerida(cat)}
              onCambio={(id, valor) => setPuntajes((p) => ({ ...p, [id]: valor }))}
            />
          ))}

          <section className="glass px-6 py-5" aria-labelledby="sec-rec">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 id="sec-rec" className="flex-1 text-[17px] font-extrabold">Recomendación final</h2>
              {cab.recomendacion_final && <span className="text-[13px] text-gris">Guardada: {textoRecomendacion(cab.recomendacion_final)}</span>}
            </div>
            <div role="radiogroup" aria-label="Recomendación final" className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2">
              {RECOMENDACIONES.map((r) => (
                <button key={r.valor} type="button" role="radio" aria-checked={recomendacion === r.valor} className="rec" disabled={bloqueada}
                  onClick={() => setRecomendacion(r.valor)}>
                  <span className={`text-[15px] font-extrabold ${r.valor === 'NO' ? 'text-rojo-texto' : ''}`}>{r.texto}</span>
                  <span className="text-xs text-gris">{r.detalle}</span>
                </button>
              ))}
            </div>
            {recomendacion === 'NO' && (
              <Campo etiqueta={cab.justificacion ? 'Agregar a la justificación' : 'Justificación (obligatoria)'} className="mt-3">
                <textarea className="field" value={justificacion} onChange={(e) => setJustificacion(e.target.value)} maxLength={2000} disabled={bloqueada}
                  placeholder="Motivos de la no renovación. Se guarda en el expediente de la evaluación." />
              </Campo>
            )}
            <Campo etiqueta="Recomendaciones para el trabajador (opcional)" className="mt-3">
              <textarea className="field" value={recomendaciones} onChange={(e) => setRecomendaciones(e.target.value)} maxLength={1000} disabled={bloqueada} />
            </Campo>
            {cab.justificacion && (
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer font-semibold text-tinta-2">Historial de justificación y renovaciones</summary>
                <pre className="mt-2 font-sans text-[13px] whitespace-pre-wrap text-tinta-2">{cab.justificacion.trim()}</pre>
              </details>
            )}
          </section>

          {gestionar && !cab.genero_contrato && (
            <section className="glass px-6 py-5" aria-labelledby="sec-asig">
              <h2 id="sec-asig" className="text-[17px] font-extrabold">Jefe evaluador y aprobadores</h2>
              <p className="mt-1 text-sm text-gris">Usuarios de la web de {nombreEmpresa(cab.empresa_nombre)} (jefes de área y RR.HH.).</p>
              <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
                <Campo etiqueta="Jefe evaluador" ayuda="Si no se cambia, se mantiene el actual.">
                  <select className="field" value={jefe} onChange={(e) => setJefe(e.target.value)}>
                    <option value="">{cab.jefe_id ? 'Mantener el actual' : 'Sin asignar'}</option>
                    {jefes.map((u) => <option key={u.usuario_id} value={u.usuario_id}>{nombrePersona(u.nombre)} · {u.perfil === 'recursos_humanos' ? 'RR.HH.' : 'Jefe de área'}</option>)}
                  </select>
                </Campo>
                <Campo etiqueta="Agregar aprobador" ayuda="Quedan pendientes hasta que respondan.">
                  <select className="field" value="" onChange={(e) => e.target.value && setNuevosAprobadores((l) => [...l, Number(e.target.value)])}>
                    <option value="">Elegir…</option>
                    {aprobadoresPosibles.map((u) => <option key={u.usuario_id} value={u.usuario_id}>{nombrePersona(u.nombre)}</option>)}
                  </select>
                </Campo>
              </div>
              {nuevosAprobadores.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {nuevosAprobadores.map((id) => {
                    const u = usuarios.find((x) => x.usuario_id === id);
                    return (
                      <li key={id} className="chip">
                        {nombrePersona(u?.nombre ?? String(id))}
                        <button type="button" aria-label={`Quitar ${u?.nombre ?? id}`} onClick={() => setNuevosAprobadores((l) => l.filter((x) => x !== id))}>
                          <Icon name="cerrar" size={14} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}

          {cab.existe && (
            <Aprobaciones empresa={empresa} aprobaciones={datos.aprobaciones} completa={rhOk && jefeOk} onHecho={(m) => onAviso({ tipo: 'ok', texto: m })} />
          )}
        </div>

        <aside className="glass flex flex-[1_1_300px] flex-col gap-4 p-5.5 lg:sticky lg:top-20" aria-label="Resumen del puntaje">
          <div className="label">Puntaje total</div>
          <div className="flex items-center gap-4">
            <Anillo total={totalRh + totalJefe} maximo={maxRh + maxJefe} />
            <div className="text-sm">
              <div className="font-bold">{estado.texto}</div>
              <div className="mt-1 text-gris">Recomienda: <strong className="text-tinta">{textoRecomendacion(recomendacion)}</strong></div>
            </div>
          </div>
          <ul className="flex flex-col gap-3">
            {[['RR.HH.', totalRh, maxRh, 'bg-tinta-2', completa('RH')], ['Jefe', totalJefe, maxJefe, 'bg-rojo', completa('JEFE')]].map(([t, v, m, color, ok]) => (
              <li key={t}>
                <div className="flex text-sm"><span className="flex-1 font-semibold">{t}{!ok && <span className="ml-1 text-xs font-normal text-gris">(incompleto)</span>}</span><span className="tabular-nums">{v}/{m}</span></div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-gris/15"><div className={`h-full rounded-full ${color}`} style={{ width: `${m ? (v / m) * 100 : 0}%` }} /></div>
              </li>
            ))}
          </ul>
          <p className="glass-soft px-3.5 py-2.5 text-xs leading-relaxed text-tinta-2">
            Escala de RR.HH.: 0 a 3 por criterio. Escala del jefe: 0 a 5. Los aprobadores pueden aprobar cuando ambas secciones estén completas.
          </p>

          <ErrorForm texto={error} />

          <div className="flex flex-col gap-2">
            {!bloqueada && (
              <button type="submit" className="btn btn-primary" disabled={guardar.isPending}>
                {guardar.isPending ? 'Guardando…' : cab.existe ? 'Guardar cambios' : 'Crear evaluación'}
              </button>
            )}
            {puedeRenovar && (
              <button type="button" className="btn btn-ok" onClick={() => setModal('renovar')}>
                <Icon name="renovar" size={18} />
                Generar renovación
              </button>
            )}
            {cab.existe && (
              <button type="button" className="btn"
                onClick={() => imprimirEvaluacion(empresa, codPersonal, cab.periodo)
                  .catch((err) => onAviso({ tipo: 'error', texto: mensajeError(err, 'No se pudo generar el PDF.') }))}>
                Imprimir evaluación
              </button>
            )}
            {gestionar && cab.existe && !cab.genero_contrato && (
              <button type="button" className="btn btn-peligro" onClick={() => setModal('anular')}>Anular evaluación</button>
            )}
          </div>
          {!gestionar && <p className="text-xs text-gris">Su rol solo permite consultar las evaluaciones.</p>}
        </aside>
      </form>

      {modal === 'renovar' && (
        <RenovarModal cab={cab} onCerrar={() => setModal(null)} onHecho={(m) => { setModal(null); onAviso({ tipo: 'ok', texto: m }); }} />
      )}
      {modal === 'anular' && (
        <Modal
          titulo="Anular evaluación"
          descripcion={`${nombrePersona(cab.nombre_completo)} · ${periodoTexto(cab.periodo)}`}
          onCerrar={() => setModal(null)}
          pie={
            <>
              <button type="button" className="btn" onClick={() => setModal(null)}>Cancelar</button>
              <button type="button" className="btn btn-primary" disabled={anular.isPending}
                onClick={() => anular.mutate(undefined, {
                  onSuccess: () => navigate('/evaluaciones', { replace: true }),
                  onError: (err) => { setModal(null); onAviso({ tipo: 'error', texto: mensajeError(err) }); },
                })}>
                {anular.isPending ? 'Anulando…' : 'Anular'}
              </button>
            </>
          }
        >
          <p className="text-sm leading-relaxed">Las calificaciones de RR.HH. y del jefe de este período quedan dadas de baja (no se borran). Las aprobaciones registradas se conservan.</p>
        </Modal>
      )}
    </>
  );
}

export default function EvaluacionPage() {
  const { empresa, codPersonal } = useParams();
  const [params] = useSearchParams();
  const periodo = params.get('periodo')?.replace('-', '') || null;
  const [aviso, setAviso] = useState(null);
  const { data, isPending, isError, error, refetch, dataUpdatedAt } = useEvaluacion(empresa, codPersonal, periodo);

  if (isPending) {
    return (
      <section className="glass flex flex-col gap-3 px-6 py-5" aria-busy="true">
        <span className="skeleton h-8 w-1/2" />
        <span className="skeleton h-20 w-full" />
        <span className="skeleton h-64 w-full" />
      </section>
    );
  }

  if (isError) {
    return (
      <section role="alert" className="glass flex flex-wrap items-center gap-3 px-5 py-4 text-sm">
        <Icon name="alerta" className="text-aviso" />
        <span className="flex-1 font-semibold">{mensajeError(error, 'No se pudo cargar la evaluación.')}</span>
        <Link to="/evaluaciones" className="btn">Volver</Link>
        <button type="button" className="btn" onClick={() => refetch()}>Reintentar</button>
      </section>
    );
  }

  return (
    <>
      <Aviso aviso={aviso} onCerrar={() => setAviso(null)} />
      {/* La clave reinicia el formulario cuando cambian el período o los datos guardados. */}
      <Formulario
        key={`${empresa}|${codPersonal}|${data.cabecera.periodo}|${dataUpdatedAt}`}
        datos={data}
        empresa={empresa}
        codPersonal={codPersonal}
        onAviso={setAviso}
      />
    </>
  );
}
