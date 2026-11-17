import { useState } from 'react';
import Modal from '../../../components/Modal';
import { Campo, ErrorForm } from '../../../components/ui';
import { mensajeError } from '../../../api/client';
import { resolverSolicitudVac } from '../../../api/endpoints/vacaciones';
import { fecha, moneda, nombrePersona } from '../../../lib/format';
import { TIPOS } from '../constantes';
import { useAccionVacaciones } from '../hooks/useVacaciones';

const TEXTOS = {
  aprobar: { titulo: 'Aprobar solicitud', boton: 'Aprobar' },
  rechazar: { titulo: 'Rechazar solicitud', boton: 'Rechazar' },
  cancelar: { titulo: 'Cancelar solicitud', boton: 'Cancelar solicitud' },
};

/** Aprobar (con período e importes de la compra), rechazar (motivo) o cancelar una solicitud. */
export default function ResolverSolicitudModal({ solicitud: s, accion, onCerrar, onHecho }) {
  const compra = s.tip_vacaciones === 'VC';
  const anio = s.ano_proceso ?? new Date().getFullYear();
  const [periodo, setPeriodo] = useState(s.periodo_vac ?? `${anio - 1}-${anio}`);
  const [importe, setImporte] = useState(s.imp_adelanto_vacac ?? '');
  const [descuento, setDescuento] = useState(s.descuento_afp ?? '');
  const [obs, setObs] = useState('');
  const [error, setError] = useState('');

  const mut = useAccionVacaciones((cuerpo) => resolverSolicitudVac(s, accion, cuerpo));
  const neto = compra && importe !== '' ? Math.max(0, Number(importe) - Number(descuento || 0)) : null;

  function enviar(e) {
    e.preventDefault();
    setError('');
    const cuerpo = { obs: obs.trim() || null };
    if (accion === 'aprobar') {
      cuerpo.periodo_vac = periodo.trim() || null;
      if (compra) {
        cuerpo.imp_adelanto_vacac = importe === '' ? null : Number(importe);
        cuerpo.descuento_afp = descuento === '' ? null : Number(descuento);
      }
    }
    mut.mutate(cuerpo, { onSuccess: (r) => onHecho(r.message), onError: (err) => setError(mensajeError(err)) });
  }

  return (
    <Modal
      titulo={TEXTOS[accion].titulo}
      descripcion={`${nombrePersona(s.nombre_completo)} · ${TIPOS[s.tip_vacaciones]?.largo ?? s.tip_vacaciones} · ${fecha(s.fec_inicio)} al ${fecha(s.fec_final)} (${s.num_dias} días)`}
      onCerrar={onCerrar}
      pie={
        <>
          <button type="button" className="btn" onClick={onCerrar}>Volver</button>
          <button type="submit" form="form-resolver" className={`btn ${accion === 'aprobar' ? 'btn-ok' : 'btn-primary'}`} disabled={mut.isPending}>
            {mut.isPending ? 'Guardando…' : TEXTOS[accion].boton}
          </button>
        </>
      }
    >
      <form id="form-resolver" onSubmit={enviar} className="flex flex-col gap-4">
        {accion === 'aprobar' && (
          <>
            {s.etapa === 'PENDIENTE_JEFE' && (
              <p className="glass-soft px-4 py-3 text-sm">El jefe aún no aprobó. RR.HH. puede aprobar directo, como en la web actual.</p>
            )}
            <Campo etiqueta="Período vacacional" ayuda="Año en que se ganaron los días, p. ej. 2025-2026.">
              <input className="field" value={periodo} onChange={(e) => setPeriodo(e.target.value)} placeholder="2025-2026" pattern="\d{4}-\d{4}" />
            </Campo>
            {compra && (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
                <Campo etiqueta="Importe del adelanto (S/)">
                  <input className="field" type="number" min="0" step="0.01" value={importe} onChange={(e) => setImporte(e.target.value)} required />
                </Campo>
                <Campo etiqueta="Descuento AFP (S/)">
                  <input className="field" type="number" min="0" step="0.01" value={descuento} onChange={(e) => setDescuento(e.target.value)} />
                </Campo>
                <div className="flex flex-col justify-end pb-2 text-sm">
                  <span className="label">Recibe</span>
                  <span className="text-lg font-extrabold tabular-nums">{moneda(neto)}</span>
                </div>
              </div>
            )}
          </>
        )}
        {accion === 'cancelar' && <p className="text-sm">La solicitud queda cancelada y sus días dejan de contarse como solicitados.</p>}
        <Campo etiqueta={accion === 'rechazar' ? 'Motivo del rechazo' : 'Observación (opcional)'}>
          <textarea className="field" value={obs} onChange={(e) => setObs(e.target.value)} maxLength={500} required={accion === 'rechazar'} />
        </Campo>
        <ErrorForm texto={error} />
      </form>
    </Modal>
  );
}
