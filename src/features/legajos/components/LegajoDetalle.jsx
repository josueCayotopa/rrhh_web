import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../components/Icon';
import { mensajeError } from '../../../api/client';
import { descargarDocumento, verDocumento } from '../../../api/endpoints/legajos';
import { useAuth } from '../../../context/AuthContext';
import { fecha, fechaHora, iniciales, nombreEmpresa, nombrePersona } from '../../../lib/format';
import { rutaFicha } from '../../personal/constantes';
import { ESTADOS_DOC, tamano } from '../constantes';
import { useHistorialDoc, useLegajo } from '../hooks/useLegajos';

function Historial({ empresa, codPersonal, codTipoDoc, onError }) {
  const { data, isPending } = useHistorialDoc(empresa, codPersonal, codTipoDoc);
  if (isPending) return <span className="skeleton mt-2 block h-10 w-full" />;
  return (
    <ul className="mt-2 flex flex-col gap-1 border-t border-linea pt-2 text-xs">
      {(data ?? []).map((h) => (
        <li key={h.cod_legajo} className="flex flex-wrap items-center gap-2">
          <span className="w-8 font-semibold">v{h.num_version}</span>
          <span className="min-w-0 flex-1 truncate" title={h.nom_archivo}>{h.nom_archivo}</span>
          <span className="text-gris">{fechaHora(h.fec_carga)} · {h.cod_usuario_carga}</span>
          {h.tip_estado !== 'A' && <span className="badge badge-neutro px-1.5! py-0! text-[10px]!">De baja</span>}
          <button type="button" className="font-semibold text-info hover:underline"
            onClick={() => verDocumento(empresa, h.cod_legajo).catch((e) => onError(mensajeError(e)))}>Ver</button>
        </li>
      ))}
    </ul>
  );
}

/** Checklist del legajo de un trabajador en una empresa. */
export default function LegajoDetalle({ seleccion, onCargar, onBaja, onAviso }) {
  const { puede } = useAuth();
  const { data, isPending, isError, error } = useLegajo(seleccion?.empresa, seleccion?.cod_personal);
  const [historial, setHistorial] = useState(null);
  const avisarError = (texto) => onAviso({ tipo: 'error', texto });

  if (!seleccion) return <aside className="glass flex-[1_1_400px] p-6 text-sm text-gris">Elija un trabajador para ver su legajo.</aside>;
  if (isPending) return <aside className="glass flex flex-[1_1_400px] flex-col gap-3 p-6" aria-busy="true"><span className="skeleton h-10 w-2/3" /><span className="skeleton h-6 w-full" /><span className="skeleton h-60 w-full" /></aside>;
  if (isError) return <aside className="glass flex-[1_1_400px] p-6 text-sm font-semibold text-rojo-texto" role="alert">{mensajeError(error)}</aside>;

  const t = data.trabajador ?? {};
  const r = data.resumen;
  const nombre = nombrePersona(t.nombre_completo ?? '');
  const requeridos = data.documentos.filter((d) => d.ind_requerido === 'S');
  const otros = data.documentos.filter((d) => d.ind_requerido !== 'S');

  const fila = (d) => {
    const est = ESTADOS_DOC[d.estado_doc] ?? { texto: d.estado_doc, clase: 'badge-neutro' };
    const abierto = historial === d.cod_tipo_doc;
    return (
      <li key={d.cod_tipo_doc} className="glass-soft px-3.5 py-2.5 text-[13px]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="min-w-0 flex-[1_1_180px] font-semibold">{d.des_tipo_doc}</span>
          <span className={`badge ${est.clase}`}>{est.texto}</span>
        </div>
        {d.cod_legajo ? (
          <div className="mt-1 text-xs text-gris">
            <span className="text-tinta">{d.nom_archivo}</span> · v{d.num_version} · {tamano(d.tam_archivo)} · {fecha(d.fec_carga)} por {d.cod_usuario_carga}
            {d.fec_vencimiento && <> · vence <strong className={d.estado_doc === 'VIGENTE' ? '' : 'text-rojo-texto'}>{fecha(d.fec_vencimiento)}</strong></>}
            {d.obs_documento && <div className="italic">{d.obs_documento}</div>}
          </div>
        ) : d.ind_vence === 'S' && <div className="mt-1 text-xs text-gris">Lleva fecha de vencimiento.</div>}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {d.cod_legajo && (
            <>
              <button type="button" className="btn btn-sm" onClick={() => verDocumento(seleccion.empresa, d.cod_legajo).catch((e) => avisarError(mensajeError(e)))}>Ver</button>
              <button type="button" className="btn btn-sm" onClick={() => descargarDocumento(seleccion.empresa, d.cod_legajo, d.nom_archivo).catch((e) => avisarError(mensajeError(e)))}>Descargar</button>
            </>
          )}
          {puede('legajos.cargar') && (
            <button type="button" className="btn btn-sm btn-ok" onClick={() => onCargar({ ...seleccion, nombre_completo: t.nombre_completo, documento: d })}>
              {d.cod_legajo ? 'Reemplazar' : 'Cargar'}
            </button>
          )}
          {d.cod_legajo && puede('legajos.eliminar') && (
            <button type="button" className="btn btn-sm btn-peligro" onClick={() => onBaja({ empresa: seleccion.empresa, documento: d })}>Dar de baja</button>
          )}
          {Number(d.num_versiones) > 1 && (
            <button type="button" className="btn btn-sm" aria-expanded={abierto} onClick={() => setHistorial(abierto ? null : d.cod_tipo_doc)}>
              Historial ({d.num_versiones})
            </button>
          )}
        </div>
        {abierto && <Historial empresa={seleccion.empresa} codPersonal={seleccion.cod_personal} codTipoDoc={d.cod_tipo_doc} onError={avisarError} />}
      </li>
    );
  };

  return (
    <aside className="glass flex min-w-0 flex-[1_1_400px] flex-col gap-4 p-5.5" aria-label="Legajo del trabajador">
      <div className="flex items-center gap-3">
        <span className="avatar h-12! w-12!">{iniciales(nombre.replace(',', ''))}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] leading-tight font-extrabold">{nombre}</h2>
          <p className="text-[13px] text-gris">
            {[t.cargo, t.area].filter(Boolean).map(nombrePersona).join(' · ')} · {nombreEmpresa(t.empresa_nombre ?? '')} · cód. {t.cod_personal}
          </p>
        </div>
        {puede('personal.ver') && (
          <Link to={rutaFicha(seleccion.empresa, seleccion.cod_personal)} className="btn btn-sm" title="Ficha 360°"><Icon name="ficha" size={16} /></Link>
        )}
      </div>

      <div>
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-semibold">Documentos requeridos</span>
          <span className="tabular-nums"><strong>{r.cargados}</strong> de {r.requeridos} · {r.porcentaje}%</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-tinta/[0.08]" role="progressbar" aria-valuenow={r.porcentaje} aria-valuemin={0} aria-valuemax={100} aria-label="Avance del legajo">
          <div className={`h-full rounded-full ${r.porcentaje === 100 ? 'bg-ok' : 'bg-aviso'}`} style={{ width: `${r.porcentaje}%` }} />
        </div>
      </div>

      {requeridos.length > 0 && (
        <div>
          <div className="label">Requeridos ({requeridos.length})</div>
          <ul className="mt-2 flex flex-col gap-2">{requeridos.map(fila)}</ul>
        </div>
      )}
      {otros.length > 0 && (
        <div>
          <div className="label">Otros documentos ({otros.length})</div>
          <ul className="mt-2 flex flex-col gap-2">{otros.map(fila)}</ul>
        </div>
      )}
      {data.documentos.length === 0 && <p className="text-sm text-gris">Esta empresa no tiene tipos de documento configurados.</p>}
    </aside>
  );
}
