import { useState } from 'react';
import Modal from '../../../components/Modal';
import { Campo, ErrorForm } from '../../../components/ui';
import { mensajeError } from '../../../api/client';
import { bajaDocumento } from '../../../api/endpoints/legajos';
import { useAccionLegajo } from '../hooks/useLegajos';

/** Baja lógica de un documento: deja de contar en el legajo pero no se borra el archivo. */
export default function BajaDocumentoModal({ empresa, documento, onCerrar, onHecho }) {
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const accion = useAccionLegajo(() => bajaDocumento(empresa, documento.cod_legajo, motivo.trim() || null));

  return (
    <Modal
      titulo="Dar de baja el documento"
      descripcion={`${documento.des_tipo_doc} · ${documento.nom_archivo}`}
      onCerrar={onCerrar}
      pie={
        <>
          <button type="button" className="btn" onClick={onCerrar}>Cancelar</button>
          <button type="submit" form="form-baja-doc" className="btn btn-peligro" disabled={accion.isPending}>
            {accion.isPending ? 'Guardando…' : 'Dar de baja'}
          </button>
        </>
      }
    >
      <form id="form-baja-doc" className="flex flex-col gap-4" onSubmit={(e) => {
        e.preventDefault();
        setError('');
        accion.mutate(undefined, { onSuccess: (r) => onHecho(r.message), onError: (err) => setError(mensajeError(err)) });
      }}>
        <p className="text-sm leading-relaxed">
          El documento deja de figurar en el legajo. El archivo no se borra y sigue visible en el historial.
        </p>
        <Campo etiqueta="Motivo (opcional)">
          <textarea className="field min-h-[72px]" maxLength={500} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </Campo>
        <ErrorForm texto={error} />
      </form>
    </Modal>
  );
}
