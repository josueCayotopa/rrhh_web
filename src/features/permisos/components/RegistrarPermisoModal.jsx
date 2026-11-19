import { useMemo, useState } from 'react';
import Modal from '../../../components/Modal';
import { Campo, ErrorForm } from '../../../components/ui';
import { mensajeError } from '../../../api/client';
import { registrarPermiso } from '../../../api/endpoints/permisos';
import { hoyIso, nombreEmpresa, nombrePersona } from '../../../lib/format';
import { useQuery } from '@tanstack/react-query';
import { getPersonal } from '../../../api/endpoints/personal';
import { useEmpresas } from '../../../context/EmpresaContext';
import { EXTENSIONES } from '../constantes';
import { useAccionPermiso, useMotivosPermiso } from '../hooks/usePermisos';

const diasEntre = (a, b) => (a && b && b >= a ? Math.round((new Date(b) - new Date(a)) / 86400000) + 1 : 0);

/**
 * RR.HH. registra un permiso por el trabajador (p. ej. trajo el formato en papel).
 * Queda pendiente de su jefe; RR.HH. puede aprobarlo luego sin esperar.
 */
export default function RegistrarPermisoModal({ onCerrar, onHecho }) {
  const [buscar, setBuscar] = useState('');
  const [q, setQ] = useState('');
  const [vinculo, setVinculo] = useState(null);   // { empresa, empresa_nombre, cod_personal, nombre }
  const [idMotivo, setIdMotivo] = useState('');
  const [f, setF] = useState({ fecha_inicio: hoyIso(), fecha_fin: hoyIso(), hora_inicio: '', hora_fin: '', des_otro: '', provincia: false, justificacion: '' });
  const [docs, setDocs] = useState({});
  const [error, setError] = useState('');

  const { seleccionadas } = useEmpresas();
  // Solo busca cuando hay texto (no lista a todo el personal).
  const personas = useQuery({
    queryKey: ['personal', 'buscar-permiso', seleccionadas, q],
    queryFn: () => getPersonal(seleccionadas, { q, estado: 'ACTIVO', per_page: 8 }),
    enabled: Boolean(q),
  });
  const catalogo = useMotivosPermiso(vinculo?.empresa);
  const motivo = catalogo.data?.motivos.find((m) => String(m.id) === String(idMotivo));
  const docsMotivo = useMemo(() => (motivo ? catalogo.data.documentos.filter((d) => d.id_motivo === motivo.id) : []), [catalogo.data, motivo]);
  const dias = diasEntre(f.fecha_inicio, f.fecha_fin);
  const tope = motivo ? (f.provincia && motivo.num_dias_max_prov ? motivo.num_dias_max_prov : motivo.num_dias_max) : null;
  const mut = useAccionPermiso((fd) => registrarPermiso(fd));
  const cambiar = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  function enviar(e) {
    e.preventDefault();
    setError('');
    if (!vinculo) return setError('Elija al trabajador.');
    if (!motivo) return setError('Elija el tipo de permiso.');
    if (tope && dias > tope) return setError(`Este permiso permite como máximo ${tope} días.`);
    const faltan = docsMotivo.filter((d) => d.ind_obligatorio === 'S' && !docs[d.id_documento]);
    if (faltan.length) return setError(`Adjunte: ${faltan.map((d) => d.des_tipo).join(', ')}.`);

    const fd = new FormData();
    fd.append('empresa', vinculo.empresa);
    fd.append('cod_personal', vinculo.cod_personal);
    fd.append('id_motivo', motivo.id);
    ['fecha_inicio', 'fecha_fin', 'hora_inicio', 'hora_fin', 'justificacion'].forEach((k) => { if (f[k]) fd.append(k, f[k]); });
    if (motivo.ind_especificar === 'S') fd.append('des_otro', f.des_otro.trim());
    if (f.provincia && motivo.num_dias_max_prov) fd.append('provincia', '1');
    let i = 0;
    Object.entries(docs).forEach(([tipo, archivo]) => {
      if (!archivo) return;
      fd.append(`documentos[${i}][archivo]`, archivo);
      fd.append(`documentos[${i}][id_tipo]`, tipo);
      i += 1;
    });
    mut.mutate(fd, { onSuccess: (r) => onHecho(r.message), onError: (err) => setError(mensajeError(err)) });
    return undefined;
  }

  return (
    <Modal titulo="Registrar permiso" descripcion="Formato de autorización de permisos no sujetos a descuento" onCerrar={onCerrar} ancho="max-w-2xl"
      pie={
        <>
          <button type="button" className="btn" onClick={onCerrar}>Cancelar</button>
          <button type="submit" form="form-permiso" className="btn btn-primary" disabled={mut.isPending}>{mut.isPending ? 'Guardando…' : 'Registrar'}</button>
        </>
      }>
      <form id="form-permiso" onSubmit={enviar} className="flex flex-col gap-4">
        {!vinculo ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-end gap-2">
              <Campo etiqueta="Trabajador" className="flex-1">
                <input className="field" type="search" placeholder="Nombre, DNI o código" value={buscar} onChange={(e) => setBuscar(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setQ(buscar.trim()); } }} />
              </Campo>
              <button type="button" className="btn" onClick={() => setQ(buscar.trim())}>Buscar</button>
            </div>
            {personas.isFetching && <span className="skeleton h-10 w-full" />}
            <ul className="flex flex-col gap-1.5">
              {(personas.data?.data ?? []).flatMap((p) => p.empresas_detalle.filter((e) => e.estado === 'AC').map((e) => (
                <li key={`${e.empresa}|${e.cod_personal}`}>
                  <button type="button" className="glass-soft w-full px-3 py-2 text-left text-[13px] hover:bg-tinta/[0.03]"
                    onClick={() => setVinculo({ empresa: e.empresa, empresa_nombre: e.empresa_nombre, cod_personal: e.cod_personal, nombre: p.nombre_completo })}>
                    <b>{nombrePersona(p.nombre_completo)}</b> · {nombreEmpresa(e.empresa_nombre)} · cód. {e.cod_personal}
                    <span className="block text-xs text-gris">{nombrePersona(e.cargo ?? '')}</span>
                  </button>
                </li>
              )))}
            </ul>
            {q && !personas.isFetching && (personas.data?.data ?? []).length === 0 && <p className="text-sm text-gris">Sin resultados.</p>}
          </div>
        ) : (
          <div className="glass-soft flex items-center gap-2 px-3 py-2 text-sm">
            <span className="flex-1"><b>{nombrePersona(vinculo.nombre)}</b> · {nombreEmpresa(vinculo.empresa_nombre)} · cód. {vinculo.cod_personal}</span>
            <button type="button" className="btn btn-sm" onClick={() => { setVinculo(null); setIdMotivo(''); setDocs({}); }}>Cambiar</button>
          </div>
        )}

        {vinculo && (
          <>
            <Campo etiqueta="Tipo de permiso">
              <select className="field" value={idMotivo} onChange={(e) => { setIdMotivo(e.target.value); setDocs({}); }} required>
                <option value="">Elija…</option>
                {(catalogo.data?.motivos ?? []).map((m) => <option key={m.id} value={m.id}>{m.des_motivo}</option>)}
              </select>
            </Campo>
            {motivo?.ind_especificar === 'S' && (
              <Campo etiqueta="Especificar"><input className="field" maxLength={200} value={f.des_otro} onChange={cambiar('des_otro')} required /></Campo>
            )}
            {motivo?.num_dias_max_prov && (
              <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={f.provincia} onChange={cambiar('provincia')} /> En provincia ({motivo.num_dias_max_prov} días)</label>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Campo etiqueta="Desde"><input type="date" className="field" value={f.fecha_inicio} onChange={cambiar('fecha_inicio')} required /></Campo>
              <Campo etiqueta="Hasta" ayuda={`${dias} días${tope ? ` · máximo ${tope}` : ''}`}><input type="date" className="field" min={f.fecha_inicio} value={f.fecha_fin} onChange={cambiar('fecha_fin')} required /></Campo>
              <Campo etiqueta="Horario desde (si aplica)"><input type="time" className="field" value={f.hora_inicio} onChange={cambiar('hora_inicio')} /></Campo>
              <Campo etiqueta="Horario hasta"><input type="time" className="field" value={f.hora_fin} onChange={cambiar('hora_fin')} /></Campo>
            </div>
            <Campo etiqueta="Motivo / justificación"><textarea className="field min-h-[64px]" maxLength={500} value={f.justificacion} onChange={cambiar('justificacion')} /></Campo>
            {docsMotivo.map((d) => (
              <Campo key={d.id_documento} etiqueta={`${d.des_tipo}${d.ind_obligatorio === 'S' ? ' (obligatorio)' : ' (opcional)'}`}>
                <input type="file" accept={EXTENSIONES} className="field py-2!" onChange={(e) => setDocs({ ...docs, [d.id_documento]: e.target.files?.[0] ?? null })} />
              </Campo>
            ))}
            <p className="text-xs text-gris">Queda pendiente de la autorización del jefe; RR.HH. puede aprobarlo sin esperar desde la bandeja.</p>
          </>
        )}
        <ErrorForm texto={error} />
      </form>
    </Modal>
  );
}
