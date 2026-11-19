import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../components/Icon';
import { Campo, Dato, ErrorForm } from '../../../components/ui';
import { mensajeError } from '../../../api/client';
import * as api from '../../../api/endpoints/permisos';
import { useAuth } from '../../../context/AuthContext';
import { fecha, fechaHora, iniciales, nombreEmpresa, nombrePersona } from '../../../lib/format';
import { imprimirPermiso } from '../../../lib/formularioPermiso';
import { rutaFicha } from '../../personal/constantes';
import { ETAPAS, EXTENSIONES, horario, textoEtapa } from '../constantes';
import { useAccionPermiso, useMotivosPermiso, usePermiso } from '../hooks/usePermisos';

/** Revisión de una solicitud: datos del formato, documentos, seguimiento y decisión de RR.HH. */
export default function PermisoDetalle({ seleccion, onAviso }) {
  const { puede } = useAuth();
  const { data, isPending, isError, error } = usePermiso(seleccion?.empresa, seleccion?.id);
  const motivos = useMotivosPermiso(seleccion?.empresa);
  const [obs, setObs] = useState('');
  const [err, setErr] = useState('');
  const [tipoDoc, setTipoDoc] = useState('');
  const [otroDoc, setOtroDoc] = useState('');
  const archivo = useRef(null);
  const accion = useAccionPermiso(({ tipo, ...p }) => (tipo === 'doc'
    ? api.adjuntarDocumentoPermiso(seleccion.empresa, seleccion.id, p.fd)
    : tipo === 'quitar' ? api.quitarDocumentoPermiso(seleccion.empresa, p.doc)
      : api.resolverPermiso(seleccion.empresa, seleccion.id, tipo, p.obs)));

  if (!seleccion) return <aside className="glass flex-[1_1_400px] p-6 text-sm text-gris">Elija una solicitud para revisarla.</aside>;
  if (isPending) return <aside className="glass flex flex-[1_1_400px] flex-col gap-3 p-6" aria-busy="true"><span className="skeleton h-10 w-2/3" /><span className="skeleton h-40 w-full" /></aside>;
  if (isError) return <aside className="glass flex-[1_1_400px] p-6 text-sm font-semibold text-rojo-texto" role="alert">{mensajeError(error)}</aside>;

  const s = data.solicitud;
  const et = ETAPAS[s.etapa] ?? { clase: 'badge-neutro' };
  const gestiona = puede('permisos.gestionar');
  const pendiente = s.estado === 'pendiente';
  const faltan = data.requeridos.filter((r) => r.ind_obligatorio === 'S' && !r.cargado);

  function ejecutar(variables, ok) {
    setErr('');
    accion.mutate(variables, {
      onSuccess: (r) => { onAviso({ tipo: 'ok', texto: r.message ?? ok }); setObs(''); },
      onError: (e) => setErr(mensajeError(e)),
    });
  }

  function adjuntar() {
    const f = archivo.current?.files?.[0];
    if (!f || !tipoDoc) { setErr('Elija el tipo de documento y el archivo.'); return; }
    const fd = new FormData();
    fd.append('archivo', f);
    fd.append('id_tipo', tipoDoc);
    if (otroDoc.trim()) fd.append('des_otro', otroDoc.trim());
    ejecutar({ tipo: 'doc', fd }, 'Documento adjuntado.');
    archivo.current.value = '';
    setOtroDoc('');
  }

  return (
    <aside className="glass flex min-w-0 flex-[1_1_400px] flex-col gap-4 p-5.5" aria-label="Solicitud de permiso">
      <div className="flex items-center gap-3">
        <span className="avatar h-12! w-12!">{iniciales(nombrePersona(s.nombre_completo ?? '').replace(',', ''))}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] leading-tight font-extrabold">{nombrePersona(s.nombre_completo)}</h2>
          <p className="text-[13px] text-gris">{[s.cargo, s.area].filter(Boolean).map(nombrePersona).join(' · ')} · {nombreEmpresa(s.empresa_nombre)} · cód. {s.cod_personal}</p>
        </div>
        {puede('personal.ver') && <Link to={rutaFicha(s.empresa, s.cod_personal)} className="btn btn-sm" title="Ficha 360°"><Icon name="ficha" size={16} /></Link>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className={`badge ${et.clase}`}>{textoEtapa(s)}</span>
        {s.en_curso && <span className="badge badge-info">En curso hoy</span>}
        {s.afecta_salario === 'S' && <span className="badge badge-aviso">Sin goce de haber</span>}
        <span className="text-xs text-gris">N° {s.id} · {s.origen === 'INTRANET' ? 'pedido en la intranet' : 'registrado por RR.HH.'} el {fechaHora(s.fecha_solicitud)}</span>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div className="col-span-2"><Dato etiqueta="Tipo de permiso">{s.des_motivo}{s.des_otro_motivo ? `: ${s.des_otro_motivo}` : ''}{s.ind_provincia === 'S' ? ' (provincia)' : ''}</Dato></div>
        <Dato etiqueta="Fechas">{fecha(s.fecha_inicio)} – {fecha(s.fecha_fin)}</Dato>
        <Dato etiqueta="Días">{s.dias_solicitados}{horario(s) ? ` · ${horario(s)}` : ''}</Dato>
        <div className="col-span-2"><Dato etiqueta="Motivo / justificación">{s.justificacion}</Dato></div>
      </dl>

      <div className="glass-soft flex flex-col gap-1.5 px-4 py-3 text-[13px]">
        <div className="label">Seguimiento</div>
        <p>{s.ind_conforme_trab === 'S' ? `Conformidad del trabajador el ${fechaHora(s.fec_conforme_trab)}${s.firma_trab_url ? ' (firma digital)' : ''}.` : 'Sin conformidad digital del trabajador.'}</p>
        {s.est_jefe === 'P'
          ? <p className="text-gris">Jefe: {s.jefe_nombre ? nombrePersona(s.jefe_nombre) : <span className="text-aviso">el trabajador no tiene jefe en la intranet</span>} — aún no decide.</p>
          : <p>{s.est_jefe === 'A' ? 'Autorizado' : 'Rechazado'} por {nombrePersona(s.nom_jefe)} ({s.cod_usuario_jefe}) el {fechaHora(s.fec_jefe)}{s.obs_jefe ? ` — “${s.obs_jefe}”` : ''}.</p>}
        {s.fecha_aprobacion_rh && <p>RR.HH.: {nombrePersona(s.nom_rrhh ?? s.cod_usuario_rrhh ?? '')} el {fechaHora(s.fecha_aprobacion_rh)}{s.obs_rrhh ? ` — “${s.obs_rrhh}”` : ''}.</p>}
      </div>

      <div>
        <div className="label">Documentación ({data.documentos.length})</div>
        {faltan.map((r) => <p key={r.id_documento} className="mt-1 text-xs font-semibold text-rojo-texto">Falta: {r.des_tipo} (obligatorio)</p>)}
        <ul className="mt-2 flex flex-col gap-1.5">
          {data.documentos.map((d) => (
            <li key={d.id} className="glass-soft flex flex-wrap items-center gap-2 px-3 py-2 text-[13px]">
              <span className="min-w-0 flex-1 truncate"><b>{d.des_tipo}{d.des_otro ? `: ${d.des_otro}` : ''}</b> · {d.nombre_documento}</span>
              <button type="button" className="btn btn-sm" onClick={() => api.verDocumentoPermiso(s.empresa, d.id).catch((e) => setErr(mensajeError(e, 'No se pudo abrir el documento.')))}>Ver</button>
              {gestiona && pendiente && (
                <button type="button" className="btn btn-sm btn-peligro" disabled={accion.isPending} onClick={() => ejecutar({ tipo: 'quitar', doc: d.id }, 'Documento quitado.')}>Quitar</button>
              )}
            </li>
          ))}
        </ul>
        {gestiona && pendiente && (
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <select className="field min-h-[38px]! flex-[1_1_160px]" value={tipoDoc} onChange={(e) => setTipoDoc(e.target.value)} aria-label="Tipo de documento">
              <option value="">Tipo de documento…</option>
              {(motivos.data?.tipos_documento ?? []).map((t) => <option key={t.id} value={t.id}>{t.des_tipo}</option>)}
            </select>
            <input ref={archivo} type="file" accept={EXTENSIONES} className="flex-[1_1_180px] text-[13px]" aria-label="Archivo" />
            <input className="field min-h-[38px]! flex-[1_1_140px]" placeholder="Detalle (si es Otro)" maxLength={200} value={otroDoc} onChange={(e) => setOtroDoc(e.target.value)} />
            <button type="button" className="btn btn-sm" disabled={accion.isPending} onClick={adjuntar}>Adjuntar</button>
          </div>
        )}
      </div>

      {gestiona && (pendiente || s.etapa === 'APROBADA') && (
        <Campo etiqueta={pendiente ? 'Observaciones de RR.HH.' : 'Motivo para anular'} ayuda={pendiente ? 'Obligatorio para rechazar.' : undefined}>
          <textarea className="field min-h-[64px]" maxLength={1000} value={obs} onChange={(e) => setObs(e.target.value)} />
        </Campo>
      )}
      <ErrorForm texto={err} />

      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" className="btn btn-sm" onClick={() => { if (!imprimirPermiso(data)) setErr('Habilite las ventanas emergentes para imprimir.'); }}>Imprimir formato</button>
        {gestiona && pendiente && s.est_jefe !== 'R' && (
          <>
            <button type="button" className="btn btn-sm btn-peligro" disabled={accion.isPending}
              onClick={() => (obs.trim() ? ejecutar({ tipo: 'rechazar', obs: obs.trim() }, 'Permiso rechazado.') : setErr('Escriba el motivo del rechazo en Observaciones.'))}>Rechazar</button>
            <button type="button" className="btn btn-sm btn-ok" disabled={accion.isPending || faltan.length > 0}
              title={s.est_jefe === 'P' ? 'El jefe aún no autoriza: RR.HH. puede aprobar directamente.' : undefined}
              onClick={() => ejecutar({ tipo: 'aprobar', obs: obs.trim() || null }, 'Permiso aprobado.')}>
              {s.est_jefe === 'P' ? 'Aprobar sin esperar al jefe' : 'Aprobar'}
            </button>
          </>
        )}
        {gestiona && (pendiente || s.etapa === 'APROBADA') && (
          <button type="button" className="btn btn-sm" disabled={accion.isPending}
            onClick={() => (s.etapa === 'APROBADA' && !obs.trim() ? setErr('Indique por qué se anula un permiso aprobado.') : ejecutar({ tipo: 'cancelar', obs: obs.trim() || null }, 'Permiso anulado.'))}>Anular</button>
        )}
      </div>
    </aside>
  );
}
