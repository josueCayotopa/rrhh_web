import { useState } from 'react';
import Modal from '../../../components/Modal';
import { Campo, ErrorForm } from '../../../components/ui';
import { mensajeError } from '../../../api/client';
import { cargarDocumento } from '../../../api/endpoints/legajos';
import { hoyIso, nombrePersona, sumarDias } from '../../../lib/format';
import { EXTENSIONES, tamano, TAMANO_MAX_MB } from '../constantes';
import { useAccionLegajo } from '../hooks/useLegajos';

/**
 * Carga un documento del legajo. Si el tipo ya tiene archivo, se guarda como
 * versión nueva (la anterior queda en el historial).
 */
export default function CargarDocumentoModal({ empresa, codPersonal, nombre, documento, onCerrar, onHecho }) {
  const [archivo, setArchivo] = useState(null);
  const [vence, setVence] = useState('');
  const [obs, setObs] = useState('');
  const [error, setError] = useState('');
  const accion = useAccionLegajo((c) => cargarDocumento(empresa, codPersonal, c));
  const reemplaza = Boolean(documento.cod_legajo);
  const pideVence = documento.ind_vence === 'S';

  function elegir(f) {
    setError('');
    if (!f) return setArchivo(null);
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!EXTENSIONES.includes(ext)) return setError(`Solo se permiten: ${EXTENSIONES.join(', ')}.`);
    if (f.size > TAMANO_MAX_MB * 1024 * 1024) return setError(`El archivo no debe superar ${TAMANO_MAX_MB} MB.`);
    return setArchivo(f);
  }

  function enviar(e) {
    e.preventDefault();
    if (!archivo) return setError('Elija el archivo.');
    setError('');
    return accion.mutate(
      { cod_tipo_doc: documento.cod_tipo_doc, archivo, fec_vencimiento: vence || null, obs_documento: obs.trim() || null },
      { onSuccess: (r) => onHecho(r.message), onError: (err) => setError(mensajeError(err)) },
    );
  }

  return (
    <Modal
      titulo={reemplaza ? 'Reemplazar documento' : 'Cargar documento'}
      descripcion={`${documento.des_tipo_doc} · ${nombrePersona(nombre)}`}
      onCerrar={onCerrar}
      pie={
        <>
          <button type="button" className="btn" onClick={onCerrar}>Cancelar</button>
          <button type="submit" form="form-legajo" className="btn btn-primary" disabled={accion.isPending || !archivo}>
            {accion.isPending ? 'Cargando…' : 'Cargar'}
          </button>
        </>
      }
    >
      <form id="form-legajo" onSubmit={enviar} className="flex flex-col gap-4">
        {reemplaza && (
          <p className="text-sm leading-relaxed">
            Ya tiene <strong>{documento.nom_archivo}</strong> (versión {documento.num_version}). El nuevo archivo queda como versión {Number(documento.num_version) + 1};
            el anterior se conserva en el historial.
          </p>
        )}
        <Campo etiqueta="Archivo" ayuda={`${EXTENSIONES.join(', ')} · máximo ${TAMANO_MAX_MB} MB`}>
          <input className="field py-2!" type="file" accept={EXTENSIONES.map((x) => `.${x}`).join(',')} onChange={(e) => elegir(e.target.files?.[0])} />
        </Campo>
        {archivo && <p className="text-xs text-gris">{archivo.name} · {tamano(archivo.size)}</p>}
        <Campo etiqueta={pideVence ? 'Fecha de vencimiento' : 'Fecha de vencimiento (opcional)'} ayuda={pideVence ? 'Este tipo de documento vence.' : undefined}>
          <input className="field" type="date" min={sumarDias(hoyIso(), 1)} value={vence} required={pideVence} onChange={(e) => setVence(e.target.value)} />
        </Campo>
        <Campo etiqueta="Observación (opcional)">
          <textarea className="field min-h-[72px]" maxLength={500} value={obs} onChange={(e) => setObs(e.target.value)} />
        </Campo>
        <ErrorForm texto={error} />
      </form>
    </Modal>
  );
}
