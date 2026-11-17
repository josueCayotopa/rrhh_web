import { useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from '../../../components/Modal';
import Icon from '../../../components/Icon';
import { Campo, ErrorForm } from '../../../components/ui';
import { mensajeError } from '../../../api/client';
import { nombreEmpresa, nombrePersona, periodoInput } from '../../../lib/format';
import { useUsuariosEvaluacion } from '../../evaluaciones/hooks/useEvaluaciones';
import { useAsignarEvaluaciones } from '../hooks/useEstructura';

const RESULTADO = {
  ASIGNADA: { texto: 'Asignada', clase: 'badge-ok' },
  YA_EXISTE: { texto: 'Ya tenía', clase: 'badge-neutro' },
  ERROR: { texto: 'Error', clase: 'badge-error' },
};

const periodoActual = () => {
  const h = new Date();
  return h.getFullYear() * 100 + h.getMonth() + 1;
};

/**
 * Asigna la evaluación para renovación a varios trabajadores de UNA empresa.
 * El jefe evaluador sale de la intranet (USUARIOS_INTRANET); RR.HH. puede
 * agregar aprobadores para todos.
 */
export default function AsignarEvaluacionModal({ empresa, empresaNombre, personas, onCerrar }) {
  const [periodo, setPeriodo] = useState(periodoInput(periodoActual()));
  const [aprobadores, setAprobadores] = useState([]);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null);
  const { data: usuarios = [] } = useUsuariosEvaluacion(empresa);
  const asignar = useAsignarEvaluaciones();

  const posibles = usuarios.filter((u) => u.es_aprobador && !aprobadores.includes(u.usuario_id));
  const sinJefe = personas.filter((p) => !p.jefe_usuario).length;

  function enviar(e) {
    e.preventDefault();
    setError('');
    asignar.mutate(
      { empresa, periodo, personal: personas.map((p) => p.cod_personal), aprobadores },
      { onSuccess: (r) => setResultado(r), onError: (err) => setError(mensajeError(err, 'No se pudo asignar.')) },
    );
  }

  if (resultado) {
    return (
      <Modal
        titulo="Resultado de la asignación"
        descripcion={resultado.message}
        onCerrar={onCerrar}
        ancho="max-w-3xl"
        pie={
          <>
            <Link to="/evaluaciones?estado=EN_PROCESO" className="btn">Ver evaluaciones en curso</Link>
            <button type="button" className="btn btn-primary" onClick={onCerrar}>Listo</button>
          </>
        }
      >
        <ul className="flex flex-col gap-2">
          {resultado.data.map((r) => {
            const est = RESULTADO[r.resultado] ?? RESULTADO.ERROR;
            return (
              <li key={r.cod_personal} className="glass-soft flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm">
                <span className={`badge ${est.clase}`}>{est.texto}</span>
                <span className="min-w-0 flex-[1_1_220px]">
                  <span className="font-bold">{nombrePersona(r.nombre_completo ?? r.cod_personal)}</span>
                  {r.jefe_nombre && <span className="block text-xs text-gris">Jefe: {nombrePersona(r.jefe_nombre)}</span>}
                </span>
                {r.mensaje && <span className="flex-[1_1_240px] text-xs text-tinta-2">{r.mensaje}</span>}
              </li>
            );
          })}
        </ul>
      </Modal>
    );
  }

  return (
    <Modal
      titulo="Asignar evaluación para renovación"
      descripcion={`${personas.length} ${personas.length === 1 ? 'trabajador' : 'trabajadores'} de ${nombreEmpresa(empresaNombre)}`}
      onCerrar={onCerrar}
      ancho="max-w-2xl"
      pie={
        <>
          <button type="button" className="btn" onClick={onCerrar}>Cancelar</button>
          <button type="submit" form="form-asignar" className="btn btn-primary" disabled={asignar.isPending}>
            {asignar.isPending ? 'Asignando…' : `Asignar a ${personas.length}`}
          </button>
        </>
      }
    >
      <form id="form-asignar" onSubmit={enviar} className="flex flex-col gap-4">
        <p className="glass-soft px-4 py-3 text-sm leading-relaxed">
          Se crea la evaluación del período con la sección de <strong>RR.HH.</strong> y la del <strong>jefe inmediato</strong>.
          El jefe es el que tiene cada trabajador en la intranet y la calificará desde <strong>“Evaluar a mi personal”</strong>.
          Si el trabajador ya tiene evaluación en ese período, no se duplica.
        </p>
        {sinJefe > 0 && (
          <p className="flex items-center gap-2 text-sm font-semibold text-aviso">
            <Icon name="alerta" size={18} />
            {sinJefe} {sinJefe === 1 ? 'trabajador no tiene' : 'trabajadores no tienen'} jefe en la intranet: RR.HH. deberá calificar ambas secciones.
          </p>
        )}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
          <Campo etiqueta="Período de la evaluación">
            <input className="field" type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} required />
          </Campo>
          <Campo etiqueta="Aprobadores (opcional)" ayuda="Se agregan a todas las evaluaciones asignadas.">
            <select className="field" value="" onChange={(e) => e.target.value && setAprobadores((l) => [...l, Number(e.target.value)])}>
              <option value="">Agregar aprobador…</option>
              {posibles.map((u) => <option key={u.usuario_id} value={u.usuario_id}>{nombrePersona(u.nombre)}</option>)}
            </select>
          </Campo>
        </div>
        {aprobadores.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {aprobadores.map((id) => {
              const u = usuarios.find((x) => x.usuario_id === id);
              return (
                <li key={id} className="chip">
                  {nombrePersona(u?.nombre ?? String(id))}
                  <button type="button" aria-label={`Quitar ${u?.nombre ?? id}`} onClick={() => setAprobadores((l) => l.filter((x) => x !== id))}>
                    <Icon name="cerrar" size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <details className="text-sm">
          <summary className="cursor-pointer font-semibold">Ver trabajadores ({personas.length})</summary>
          <ul className="mt-2 max-h-48 overflow-y-auto text-[13px]">
            {personas.map((p) => (
              <li key={p.cod_personal} className="border-b border-linea py-1.5">
                {nombrePersona(p.nombre_completo)} <span className="text-gris">· jefe: {p.jefe_nombre ? nombrePersona(p.jefe_nombre) : 'sin jefe'}</span>
              </li>
            ))}
          </ul>
        </details>
        <ErrorForm texto={error} />
      </form>
    </Modal>
  );
}
