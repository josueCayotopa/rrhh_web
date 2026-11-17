import { SECCIONES } from '../constantes';

/**
 * Criterios de una sección (RH o JEFE) con escala 0..ESCALA_MAX.
 * `puntajes`: { [criterio_id]: { puntaje, observacion } }
 */
export default function SeccionCriterios({ categoria, criterios, puntajes, onCambio, bloqueada, requerida }) {
  const sec = SECCIONES[categoria];
  const subtotal = criterios.reduce((s, c) => s + (puntajes[c.criterio_id]?.puntaje ?? 0) * c.peso, 0);
  const maximo = criterios.reduce((s, c) => s + c.escala_max * c.peso, 0);
  const calificados = criterios.filter((c) => puntajes[c.criterio_id]?.puntaje !== undefined && puntajes[c.criterio_id]?.puntaje !== null).length;
  const completa = calificados === criterios.length;

  return (
    <section className="glass px-6 py-5" aria-labelledby={`sec-${categoria}`}>
      <div className="flex flex-wrap items-center gap-2.5">
        <h2 id={`sec-${categoria}`} className="flex-[1_1_220px] text-[17px] font-extrabold">{sec.titulo}</h2>
        {!requerida && <span className="badge badge-neutro">No requerida en este período</span>}
        {requerida && <span className={`badge ${completa ? 'badge-ok' : calificados ? 'badge-aviso' : 'badge-neutro'}`}>
          {completa ? 'Completa' : `${calificados} de ${criterios.length} criterios`}
        </span>}
        <span className="text-sm font-extrabold tabular-nums">{subtotal} / {maximo} pts</span>
      </div>

      <ol className="mt-4 flex flex-col gap-3">
        {criterios.map((c, i) => {
          const actual = puntajes[c.criterio_id] ?? {};
          const opciones = Array.from({ length: c.escala_max + 1 }, (_, n) => n);
          return (
            <li key={c.criterio_id} className="glass-soft flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-[1_1_260px]">
                <div className="text-sm font-bold">{i + 1}. {c.descripcion}</div>
                <div className="text-xs text-gris">Escala 0 a {c.escala_max}{c.peso !== 1 ? ` · peso ${c.peso}` : ''}</div>
              </div>
              <div role="group" aria-label={`Puntaje de ${c.descripcion}, 0 a ${c.escala_max}`} className="flex flex-wrap gap-1.5">
                {opciones.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="opt"
                    aria-pressed={actual.puntaje === n}
                    disabled={bloqueada}
                    onClick={() => onCambio(c.criterio_id, { ...actual, puntaje: n })}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <label className="w-full">
                <span className="sr-only">Observación sobre {c.descripcion}</span>
                <input
                  className="field min-h-[38px]! text-[13px]!"
                  placeholder="Observación (opcional)"
                  maxLength={2000}
                  value={actual.observacion ?? ''}
                  disabled={bloqueada}
                  onChange={(e) => onCambio(c.criterio_id, { ...actual, observacion: e.target.value })}
                />
              </label>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
