import { useState } from 'react';
import { Campo, ErrorForm } from '../../../components/ui';
import { mensajeError } from '../../../api/client';
import { resolverAprobacion } from '../../../api/endpoints/evaluaciones';
import { useAuth } from '../../../context/AuthContext';
import { fechaHora, iniciales, nombrePersona } from '../../../lib/format';
import { RECOMENDACIONES, textoRecomendacion } from '../constantes';
import { useAccionEvaluacion } from '../hooks/useEvaluaciones';

const ESTADO = {
  P: { texto: 'Pendiente', clase: 'badge-neutro' },
  A: { texto: 'Aprobó', clase: 'badge-ok' },
  R: { texto: 'Rechazó', clase: 'badge-error' },
};

/** Formulario para que el aprobador asignado resuelva su aprobación. */
function Resolver({ empresa, aprobacion, completa, onHecho }) {
  const [accion, setAccion] = useState('APROBAR');
  const [comentario, setComentario] = useState('');
  const [rec, setRec] = useState('');
  const [justif, setJustif] = useState('');
  const [error, setError] = useState('');
  const mut = useAccionEvaluacion((cuerpo) => resolverAprobacion(empresa, aprobacion.aprobacion_id, cuerpo));

  if (!completa) {
    return <p className="mt-2 text-xs text-gris">Podrá aprobar cuando RR.HH. y el jefe terminen de calificar.</p>;
  }

  function enviar(e) {
    e.preventDefault();
    setError('');
    mut.mutate(
      { accion, comentario: comentario.trim() || null, recomendacion_final: rec || null, justificacion_cambio: justif.trim() || null },
      { onSuccess: (r) => onHecho(r.message), onError: (err) => setError(mensajeError(err)) },
    );
  }

  return (
    <form onSubmit={enviar} className="mt-3 flex flex-col gap-3 border-t border-linea pt-3">
      <div role="group" aria-label="Su decisión" className="flex flex-wrap gap-2">
        {[['APROBAR', 'Aprobar'], ['OBSER_PERIODO', 'Aprobar con otro período'], ['RECHAZAR', 'Rechazar']].map(([v, t]) => (
          <button key={v} type="button" className="chip" aria-pressed={accion === v} onClick={() => setAccion(v)}>{t}</button>
        ))}
      </div>
      {accion === 'OBSER_PERIODO' && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
          <Campo etiqueta="Nuevo período recomendado">
            <select className="field" value={rec} onChange={(e) => setRec(e.target.value)} required>
              <option value="">Elegir…</option>
              {RECOMENDACIONES.map((r) => <option key={r.valor} value={r.valor}>{r.texto}</option>)}
            </select>
          </Campo>
          <Campo etiqueta="Justificación del cambio">
            <input className="field" value={justif} onChange={(e) => setJustif(e.target.value)} maxLength={2000} required />
          </Campo>
        </div>
      )}
      <Campo etiqueta={accion === 'RECHAZAR' ? 'Motivo del rechazo' : 'Comentario (opcional)'}>
        <input className="field" value={comentario} onChange={(e) => setComentario(e.target.value)} maxLength={500} required={accion === 'RECHAZAR'} />
      </Campo>
      <ErrorForm texto={error} />
      <button type="submit" className={`btn self-start ${accion === 'RECHAZAR' ? 'btn-peligro' : 'btn-ok'}`} disabled={mut.isPending}>
        {mut.isPending ? 'Guardando…' : 'Registrar decisión'}
      </button>
    </form>
  );
}

export default function Aprobaciones({ empresa, aprobaciones, completa, onHecho }) {
  const { puede } = useAuth();

  return (
    <section className="glass px-6 py-5" aria-labelledby="sec-aprob">
      <h2 id="sec-aprob" className="text-[17px] font-extrabold">Aprobaciones</h2>
      {aprobaciones.length === 0 && (
        <p className="mt-2 text-sm text-gris">Sin aprobadores. Al completar ambas secciones la evaluación queda cerrada y lista para renovar.</p>
      )}
      <ol className="mt-3 flex flex-col gap-2.5">
        {aprobaciones.map((a) => {
          const est = ESTADO[a.estado] ?? ESTADO.P;
          return (
            <li key={a.aprobacion_id} className="glass-soft px-4 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="avatar">{iniciales(nombrePersona(a.nombre ?? a.usuario))}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold">{nombrePersona(a.nombre ?? a.usuario)}{a.es_mia && <span className="ml-2 text-xs font-semibold text-rojo-texto">(usted)</span>}</div>
                  <div className="text-xs text-gris">
                    {a.fecha_accion ? `${fechaHora(a.fecha_accion)}` : 'Sin respuesta'}
                    {a.recomendacion_periodo && ` · recomienda ${textoRecomendacion(a.recomendacion_periodo)}`}
                  </div>
                </div>
                <span className={`badge ${est.clase}`}>{est.texto}</span>
              </div>
              {a.comentario && <p className="mt-2 text-[13px] text-tinta-2">“{a.comentario}”</p>}
              {a.es_mia && a.estado === 'P' && puede('evaluaciones.aprobar') && (
                <Resolver empresa={empresa} aprobacion={a} completa={completa} onHecho={onHecho} />
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
