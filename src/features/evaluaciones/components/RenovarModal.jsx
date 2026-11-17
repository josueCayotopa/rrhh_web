import { useState } from 'react';
import Modal from '../../../components/Modal';
import { Campo, ErrorForm } from '../../../components/ui';
import { mensajeError } from '../../../api/client';
import { renovarDesdeEvaluacion } from '../../../api/endpoints/evaluaciones';
import { duracion, fecha, finPorMeses, hoyIso, moneda, nombrePersona, sumarDias, textoDuracion } from '../../../lib/format';
import { RECOMENDACIONES, textoRecomendacion } from '../constantes';
import { useAccionEvaluacion } from '../hooks/useEvaluaciones';

/** Genera el contrato de renovación a partir de una evaluación aprobada (o cerrada). */
export default function RenovarModal({ cab, onCerrar, onHecho }) {
  const rec = RECOMENDACIONES.find((r) => r.valor === cab.recomendacion_final);
  const indeterminado = cab.recomendacion_final === 'IN';
  const inicioSugerido = cab.contrato_fec_fin && cab.contrato_fec_fin < '2050-01-01' ? sumarDias(cab.contrato_fec_fin, 1) : hoyIso();

  const [inicio, setInicio] = useState(inicioSugerido);
  const [fin, setFin] = useState(rec?.meses ? finPorMeses(inicioSugerido, rec.meses) : '');
  const [sueldo, setSueldo] = useState(cab.contrato_sueldo ?? '');
  const [obs, setObs] = useState('');
  const [error, setError] = useState('');

  const mut = useAccionEvaluacion((cuerpo) => renovarDesdeEvaluacion(cab.empresa, cab.cod_personal, cab.periodo, cuerpo));
  const dur = indeterminado ? null : duracion(inicio, fin);

  function enviar(e) {
    e.preventDefault();
    setError('');
    mut.mutate(
      { fecha_inicio: inicio, fecha_fin: indeterminado ? null : fin, sueldo: sueldo === '' ? null : sueldo, observaciones: obs.trim() || null },
      { onSuccess: (r) => onHecho(r.message), onError: (err) => setError(mensajeError(err)) },
    );
  }

  return (
    <Modal
      titulo="Generar renovación"
      descripcion={`${nombrePersona(cab.nombre_completo)} · recomendación: ${textoRecomendacion(cab.recomendacion_final)}`}
      onCerrar={onCerrar}
      pie={
        <>
          <button type="button" className="btn" onClick={onCerrar}>Cancelar</button>
          <button type="submit" form="form-renovar" className="btn btn-primary" disabled={mut.isPending}>
            {mut.isPending ? 'Generando…' : 'Generar contrato'}
          </button>
        </>
      }
    >
      <form id="form-renovar" onSubmit={enviar} className="flex flex-col gap-4">
        <p className="glass-soft px-4 py-3 text-sm leading-relaxed">
          El contrato N° {cab.contrato_cod ?? '—'} ({fecha(cab.contrato_fec_inicio)} – {fecha(cab.contrato_fec_fin)}, {moneda(cab.contrato_sueldo)}) pasa a
          <strong> Vencido</strong> y se crea el siguiente <strong>en proceso</strong>
          {indeterminado ? <> como <strong>indeterminado</strong></> : ' del mismo tipo'}, con el mismo horario.
        </p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
          <Campo etiqueta="Inicio">
            <input className="field" type="date" value={inicio} onChange={(e) => {
              setInicio(e.target.value);
              if (rec?.meses && e.target.value) setFin(finPorMeses(e.target.value, rec.meses));
            }} required />
          </Campo>
          {!indeterminado && (
            <Campo etiqueta="Fin" ayuda={textoDuracion(dur)}>
              <input className="field" type="date" value={fin} min={inicio} onChange={(e) => setFin(e.target.value)} required />
            </Campo>
          )}
          <Campo etiqueta="Sueldo (S/)" ayuda="Vacío = el del contrato anterior.">
            <input className="field" type="number" min="0" step="0.01" value={sueldo} onChange={(e) => setSueldo(e.target.value)} />
          </Campo>
        </div>
        <Campo etiqueta="Observaciones (opcional)" ayuda="Se anotan en el historial de la evaluación.">
          <textarea className="field" value={obs} onChange={(e) => setObs(e.target.value)} maxLength={1000} />
        </Campo>
        <ErrorForm texto={error} />
      </form>
    </Modal>
  );
}
