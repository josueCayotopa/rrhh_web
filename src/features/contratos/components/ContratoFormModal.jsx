import { useMemo, useState } from 'react';
import Modal from '../../../components/Modal';
import { Campo, ErrorForm } from '../../../components/ui';
import { mensajeError } from '../../../api/client';
import * as api from '../../../api/endpoints/contratos';
import { useAuth } from '../../../context/AuthContext';
import { useEmpresas } from '../../../context/EmpresaContext';
import { duracion, fecha, finPorMeses, hoyIso, nombreEmpresa, nombrePersona, sumarDias, textoDuracion } from '../../../lib/format';
import { CAMPOS_PRACTICA, DURACIONES } from '../constantes';
import { useAccionContrato, usePersonalDisponible, useTiposContrato } from '../hooks/useContratos';

const TITULOS = {
  nuevo: ['Nuevo contrato', 'Contrato inicial para personal activo que aún no tiene contratos.'],
  renovar: ['Renovar contrato', 'El contrato actual pasa a "Vencido" y se crea el siguiente en proceso.'],
  editar: ['Editar contrato', 'Solo se editan contratos en proceso.'],
};

/** Valores iniciales según el modo. `contrato` es el detalle (SP_RRHH_CONTRATO_DETALLE). */
function inicial(modo, contrato) {
  if (modo === 'nuevo') {
    return { tip_contrato: 'AM', fec_inicio: hoyIso(), fec_fin: finPorMeses(hoyIso(), 3), sueldo: '', des_contrato: '', des_horario: '', practica: {} };
  }
  const practica = Object.fromEntries(CAMPOS_PRACTICA.map(({ campo }) => [campo, contrato[campo] ?? '']));
  if (modo === 'editar') {
    return {
      tip_contrato: contrato.tip_contrato,
      fec_inicio: contrato.fec_inicio,
      fec_fin: contrato.tip_contrato === 'IN' ? '' : contrato.fec_fin,
      sueldo: contrato.sueldo ?? '',
      des_contrato: contrato.des_contrato ?? '',
      des_horario: contrato.des_horario ?? '',
      practica,
    };
  }
  // Renovación: empieza el día siguiente al fin del contrato actual.
  const inicio = contrato.fec_fin && contrato.fec_fin < '2050-01-01' ? sumarDias(contrato.fec_fin, 1) : hoyIso();
  return {
    tip_contrato: contrato.tip_contrato,
    fec_inicio: inicio,
    fec_fin: contrato.tip_contrato === 'IN' ? '' : finPorMeses(inicio, Math.max(1, contrato.duracion || 3)),
    sueldo: contrato.sueldo ?? '',
    des_contrato: '',
    des_horario: contrato.des_horario ?? '',
    practica,
  };
}

function ElegirPersonal({ empresa, setEmpresa, persona, setPersona }) {
  const { empresas } = useAuth();
  const [texto, setTexto] = useState('');
  const [q, setQ] = useState('');
  const { data = [], isFetching } = usePersonalDisponible(empresa, q);

  return (
    <div className="flex flex-col gap-3">
      <Campo etiqueta="Empresa">
        <select className="field" value={empresa} onChange={(e) => { setEmpresa(e.target.value); setPersona(null); }} required>
          <option value="">Elegir empresa…</option>
          {empresas.map((e) => (
            <option key={e.empresa} value={e.empresa}>{nombreEmpresa(e.nombre)}</option>
          ))}
        </select>
      </Campo>
      {empresa && !persona && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              className="field"
              placeholder="Buscar por nombre, DNI o código"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setQ(texto.trim()); } }}
              aria-label="Buscar trabajador sin contrato"
            />
            <button type="button" className="btn" onClick={() => setQ(texto.trim())}>Buscar</button>
          </div>
          <p className="text-xs text-gris">Personal activo de planilla (empleados, obreros, funcionarios) que aún no tiene contratos.</p>
          <ul className="max-h-56 overflow-y-auto rounded-2xl border border-linea">
            {isFetching && <li className="px-4 py-3 text-sm text-gris">Buscando…</li>}
            {!isFetching && data.length === 0 && <li className="px-4 py-3 text-sm text-gris">Sin resultados.</li>}
            {!isFetching && data.map((p) => (
              <li key={p.cod_personal}>
                <button type="button" className="flex w-full flex-col items-start border-b border-linea px-4 py-2.5 text-left hover:bg-tinta/[0.03]" onClick={() => setPersona(p)}>
                  <span className="text-sm font-bold">{nombrePersona(p.nombre_completo)}</span>
                  <span className="text-xs text-gris">DNI {p.dni ?? '—'} · {p.cargo ?? 'Sin cargo'} · {p.des_tipo_planilla}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {persona && (
        <div className="glass-soft flex items-center gap-3 px-4 py-3">
          <div className="flex-1">
            <div className="text-sm font-bold">{nombrePersona(persona.nombre_completo)}</div>
            <div className="text-xs text-gris">DNI {persona.dni ?? '—'} · {persona.cargo ?? 'Sin cargo'} · ingreso {fecha(persona.fec_ingreso)}</div>
          </div>
          <button type="button" className="btn btn-sm" onClick={() => setPersona(null)}>Cambiar</button>
        </div>
      )}
    </div>
  );
}

export default function ContratoFormModal({ modo, contrato, onCerrar, onHecho }) {
  const { seleccionadas } = useEmpresas();
  const [form, setForm] = useState(() => inicial(modo, contrato));
  const [empresa, setEmpresa] = useState(seleccionadas.length === 1 ? seleccionadas[0] : '');
  const [persona, setPersona] = useState(null);
  const { data: tipos = [] } = useTiposContrato();
  const [error, setError] = useState('');

  const accion = useAccionContrato((cuerpo) => {
    if (modo === 'nuevo') return api.crearContrato(cuerpo);
    if (modo === 'renovar') return api.renovarContrato(contrato, cuerpo);
    return api.editarContrato(contrato, cuerpo);
  });

  const indeterminado = form.tip_contrato === 'IN';
  const practica = form.tip_contrato === 'PP';
  const dur = useMemo(() => (indeterminado ? null : duracion(form.fec_inicio, form.fec_fin)), [indeterminado, form.fec_inicio, form.fec_fin]);
  const descripcionAuto = indeterminado ? 'Contrato Indeterminado turno mañana' : dur ? `Contrato por ${dur.meses} meses${dur.dias ? ` y ${dur.dias} días` : ''} turno mañana` : '';

  const cambiar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  const cambiarPractica = (campo) => (e) => setForm((f) => ({ ...f, practica: { ...f.practica, [campo]: e.target.value } }));

  function enviar(e) {
    e.preventDefault();
    setError('');
    if (modo === 'nuevo' && !persona) {
      setError('Elija el trabajador.');
      return;
    }
    const cuerpo = {
      tip_contrato: form.tip_contrato,
      fec_inicio: form.fec_inicio,
      fec_fin: indeterminado ? null : form.fec_fin,
      sueldo: form.sueldo,
      des_contrato: form.des_contrato.trim() || null,
      des_horario: form.des_horario.trim() || null,
      practica: practica ? form.practica : null,
      ...(modo === 'nuevo' ? { empresa, cod_personal: persona.cod_personal } : {}),
    };
    accion.mutate(cuerpo, {
      onSuccess: (r) => onHecho(r.message, r.data),
      onError: (err) => setError(mensajeError(err, 'No se pudo guardar el contrato.')),
    });
  }

  const [titulo, descripcion] = TITULOS[modo];

  return (
    <Modal
      titulo={titulo}
      descripcion={modo === 'nuevo' ? descripcion : `${nombrePersona(contrato.nombre_completo)} · contrato N° ${contrato.cod_contrato}. ${descripcion}`}
      onCerrar={onCerrar}
      ancho="max-w-2xl"
      pie={
        <>
          <button type="button" className="btn" onClick={onCerrar}>Cancelar</button>
          <button type="submit" form="form-contrato" className="btn btn-primary" disabled={accion.isPending}>
            {accion.isPending ? 'Guardando…' : modo === 'renovar' ? 'Renovar contrato' : 'Guardar'}
          </button>
        </>
      }
    >
      <form id="form-contrato" onSubmit={enviar} className="flex flex-col gap-4">
        {modo === 'nuevo' && <ElegirPersonal empresa={empresa} setEmpresa={setEmpresa} persona={persona} setPersona={setPersona} />}

        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
          <Campo etiqueta="Tipo de contrato">
            <select className="field" value={form.tip_contrato} onChange={cambiar('tip_contrato')} required>
              {tipos.map((t) => (
                <option key={t.tip_contrato} value={t.tip_contrato}>{nombrePersona(t.des_tipo_contrato)}</option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Sueldo (S/)">
            <input className="field" type="number" min="0" step="0.01" value={form.sueldo} onChange={cambiar('sueldo')} required />
          </Campo>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
          <Campo etiqueta="Inicio">
            <input className="field" type="date" value={form.fec_inicio} onChange={cambiar('fec_inicio')} required />
          </Campo>
          {!indeterminado && (
            <Campo etiqueta="Fin">
              <input className="field" type="date" value={form.fec_fin} min={form.fec_inicio} onChange={cambiar('fec_fin')} required />
            </Campo>
          )}
        </div>

        {!indeterminado && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="label mr-1">Duración</span>
            {DURACIONES.map((m) => (
              <button
                key={m}
                type="button"
                className="chip"
                aria-pressed={dur?.meses === m && dur?.dias === 0}
                onClick={() => setForm((f) => ({ ...f, fec_fin: finPorMeses(f.fec_inicio, m) }))}
              >
                {m} {m === 1 ? 'mes' : 'meses'}
              </button>
            ))}
            <span className="ml-auto text-sm font-semibold text-tinta-2">{textoDuracion(dur)}</span>
          </div>
        )}
        {indeterminado && <p className="glass-soft px-4 py-3 text-sm">Sin fecha de fin: se registra con la fecha "sin fin" (31/12/2050), igual que hoy.</p>}

        <Campo etiqueta="Descripción" ayuda="Si se deja vacía se usa el texto sugerido.">
          <input className="field" maxLength={50} value={form.des_contrato} onChange={cambiar('des_contrato')} placeholder={descripcionAuto} />
        </Campo>
        <Campo etiqueta="Horario" ayuda={modo === 'renovar' ? 'Si se deja vacío se mantiene el del contrato anterior.' : undefined}>
          <input className="field" maxLength={250} value={form.des_horario} onChange={cambiar('des_horario')} required={practica} />
        </Campo>

        {practica && (
          <fieldset className="flex flex-col gap-3 rounded-2xl border border-linea p-4">
            <legend className="label px-1">Convenio de prácticas pre profesionales</legend>
            {modo !== 'nuevo' && contrato.pra_disponible === false && (
              <p className="text-sm text-aviso">Esta empresa aún no tiene las columnas del convenio; los datos no se guardarán.</p>
            )}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
              {CAMPOS_PRACTICA.map((c) => (
                <Campo key={c.campo} etiqueta={c.etiqueta + (c.obligatorio ? '' : ' (opcional)')}>
                  <input className="field" maxLength={c.max} value={form.practica[c.campo] ?? ''} onChange={cambiarPractica(c.campo)} required={c.obligatorio} />
                </Campo>
              ))}
            </div>
          </fieldset>
        )}

        <ErrorForm texto={error} />
      </form>
    </Modal>
  );
}
