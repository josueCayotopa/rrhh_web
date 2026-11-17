import { useState } from 'react';
import Modal from '../../../components/Modal';
import { Campo, ErrorForm } from '../../../components/ui';
import { mensajeError } from '../../../api/client';
import * as api from '../../../api/endpoints/contratos';
import { fecha, hoyIso, nombrePersona } from '../../../lib/format';
import { useAccionContrato } from '../hooks/useContratos';

/**
 * Anular un contrato en proceso, o registrar el cese del trabajador
 * (cierra TODOS sus contratos en proceso y lo deja como cesado).
 */
export default function CerrarContratoModal({ tipo, contrato, onCerrar, onHecho }) {
  const cese = tipo === 'cesar';
  const [fechaCese, setFechaCese] = useState(() => {
    const hoy = hoyIso();
    return contrato.fec_fin && contrato.fec_fin < hoy ? contrato.fec_fin : hoy;
  });
  const [error, setError] = useState('');

  const accion = useAccionContrato(() => (cese ? api.cesarTrabajador(contrato, fechaCese) : api.anularContrato(contrato)));

  function confirmar(e) {
    e.preventDefault();
    setError('');
    accion.mutate(undefined, {
      onSuccess: (r) => onHecho(r.message),
      onError: (err) => setError(mensajeError(err)),
    });
  }

  return (
    <Modal
      titulo={cese ? 'Registrar cese' : 'Anular contrato'}
      descripcion={`${nombrePersona(contrato.nombre_completo)} · contrato N° ${contrato.cod_contrato}`}
      onCerrar={onCerrar}
      pie={
        <>
          <button type="button" className="btn" onClick={onCerrar}>Cancelar</button>
          <button type="submit" form="form-cerrar" className="btn btn-primary" disabled={accion.isPending}>
            {accion.isPending ? 'Guardando…' : cese ? 'Registrar cese' : 'Anular contrato'}
          </button>
        </>
      }
    >
      <form id="form-cerrar" onSubmit={confirmar} className="flex flex-col gap-4">
        {cese ? (
          <>
            <p className="text-sm leading-relaxed">
              Todos los contratos <strong>en proceso</strong> del trabajador pasan a <strong>Cesado</strong> con fin en la fecha de cese,
              y el trabajador queda como cesado en planilla.
            </p>
            <Campo etiqueta="Fecha de cese">
              <input className="field" type="date" value={fechaCese} min={contrato.fec_inicio} onChange={(e) => setFechaCese(e.target.value)} required />
            </Campo>
          </>
        ) : (
          <p className="text-sm leading-relaxed">
            El contrato del {fecha(contrato.fec_inicio)} al {fecha(contrato.fec_fin)} queda <strong>sin efecto</strong> (estado Anulado).
            No se borra: sigue en el historial del trabajador.
          </p>
        )}
        <ErrorForm texto={error} />
      </form>
    </Modal>
  );
}
