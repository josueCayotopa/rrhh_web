import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../../../api/endpoints/contratos';
import Semaforo from './Semaforo';
import Icon from '../../../components/Icon';
import { Dato } from '../../../components/ui';
import { mensajeError } from '../../../api/client';
import { useAuth } from '../../../context/AuthContext';
import { fecha, iniciales, moneda, nombreEmpresa, nombrePersona, periodoTexto, textoDuracion } from '../../../lib/format';
import { ESTADOS_EVALUACION } from '../../evaluaciones/constantes';
import { INDICADOR, SITUACIONES, TOPE_MODAL_DIAS, textoVencimiento } from '../constantes';
import { useAccionContrato, useContrato } from '../hooks/useContratos';

const ESTADO_HIST = { P: 'En proceso', V: 'Vencido', A: 'Anulado', C: 'Cesado' };

function TopeModal({ dias }) {
  const pct = Math.min(100, Math.round((dias / TOPE_MODAL_DIAS) * 100));
  const anios = Math.floor(dias / 365);
  const meses = Math.floor((dias % 365) / 30);
  const color = pct >= 90 ? 'bg-rojo' : pct >= 70 ? 'bg-[#E9730C]' : 'bg-ok';

  return (
    <div className="glass-soft px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="label flex-1">Tiempo en contratos a modalidad</span>
        <span className="text-sm font-bold tabular-nums">{anios} a {meses} m / 5 años</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-gris/15" role="img" aria-label={`${pct}% del tope legal`}>
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-gris">Tope legal de contratos sujetos a modalidad (D.S. 003-97-TR, art. 74). Suma los contratos AM ya trabajados.</p>
    </div>
  );
}

/** Imprimir el contrato (en proceso), ver o cargar el firmado, y estado de la firma digital. */
function Documentos({ c }) {
  const { puede } = useAuth();
  const entrada = useRef(null);
  const [mensaje, setMensaje] = useState(null);
  const subir = useAccionContrato((archivo) => api.subirContratoFirmado(c, archivo));
  const abrir = (fn) => fn(c).catch((err) => setMensaje({ error: true, texto: mensajeError(err, 'No se pudo abrir el documento.') }));

  function elegir(e) {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    if (archivo.type !== 'application/pdf') {
      setMensaje({ error: true, texto: 'El contrato firmado debe ser un PDF.' });
      return;
    }
    if (archivo.size > 10 * 1024 * 1024) {
      setMensaje({ error: true, texto: 'El archivo supera los 10 MB.' });
      return;
    }
    setMensaje(null);
    subir.mutate(archivo, {
      onSuccess: (r) => setMensaje({ error: false, texto: r.message }),
      onError: (err) => setMensaje({ error: true, texto: mensajeError(err, 'No se pudo cargar el archivo.') }),
    });
  }

  return (
    <div>
      <div className="label">Documentos</div>
      <ul className="mt-2 flex flex-col gap-2 text-sm">
        <li className="glass-soft flex flex-wrap items-center gap-2 px-3.5 py-2.5">
          <span className="flex-1">Contrato para firmar</span>
          {c.estado === 'P'
            ? <button type="button" className="btn btn-sm" onClick={() => abrir(api.imprimirContrato)}>Imprimir</button>
            : <span className="text-xs text-gris">Solo en proceso</span>}
        </li>
        <li className="glass-soft flex flex-wrap items-center gap-2 px-3.5 py-2.5">
          <span className="flex-1">
            Contrato firmado y escaneado
            <span className={`badge ml-2 ${c.tiene_archivo ? 'badge-ok' : 'badge-neutro'}`}>{c.tiene_archivo ? 'Cargado' : 'Sin cargar'}</span>
          </span>
          {c.tiene_archivo && <button type="button" className="btn btn-sm" onClick={() => abrir(api.verContratoFirmado)}>Ver</button>}
          {puede('contratos.gestionar') && c.estado !== 'A' && (
            <>
              <button type="button" className="btn btn-sm" disabled={subir.isPending} onClick={() => entrada.current?.click()}>
                {subir.isPending ? 'Cargando…' : c.tiene_archivo ? 'Reemplazar' : 'Cargar PDF'}
              </button>
              <input ref={entrada} type="file" accept="application/pdf" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={elegir} />
            </>
          )}
        </li>
        <li className="glass-soft flex items-center gap-2 px-3.5 py-2.5">
          <span className="flex-1">Firma digital</span>
          <span className={`badge ${c.ind_firmado === 'S' ? 'badge-ok' : 'badge-neutro'}`}>
            {c.ind_firmado === 'S' ? `Firmado ${fecha(c.fec_hora_firma)}` : 'Próximamente'}
          </span>
        </li>
      </ul>
      {mensaje && (
        <p role={mensaje.error ? 'alert' : 'status'} className={`mt-2 text-xs font-semibold ${mensaje.error ? 'text-rojo-texto' : 'text-ok'}`}>{mensaje.texto}</p>
      )}
    </div>
  );
}

export default function ContratoDetalle({ seleccion, onAccion }) {
  const { puede } = useAuth();
  const { data, isPending, isError, error } = useContrato(seleccion);

  if (!seleccion) {
    return (
      <aside className="glass flex-[1_1_340px] p-6 text-sm text-gris" aria-label="Detalle del contrato">
        Elija un contrato de la lista para ver su detalle, historial y acciones.
      </aside>
    );
  }

  if (isPending) {
    return (
      <aside className="glass flex flex-[1_1_340px] flex-col gap-3 p-6" aria-label="Detalle del contrato" aria-busy="true">
        <span className="skeleton h-10 w-2/3" />
        <span className="skeleton h-24 w-full" />
        <span className="skeleton h-32 w-full" />
      </aside>
    );
  }

  if (isError) {
    return (
      <aside className="glass flex-[1_1_340px] p-6 text-sm font-semibold text-rojo-texto" role="alert">
        {mensajeError(error, 'No se pudo cargar el contrato.')}
      </aside>
    );
  }

  const c = { ...data.contrato, empresa: seleccion.empresa };
  const sit = SITUACIONES[c.situacion] ?? SITUACIONES.SIN_ESTADO;
  const venc = textoVencimiento(c);
  const enProceso = c.estado === 'P';
  const gestionar = puede('contratos.gestionar') && enProceso;
  const ultimaEval = data.evaluaciones[0];

  return (
    <aside className="glass flex min-w-0 flex-[1_1_340px] flex-col gap-4 p-5.5" aria-label="Detalle del contrato">
      <div className="flex items-center gap-3">
        <span className="avatar h-12! w-12! text-[15px]!">{iniciales(nombrePersona(c.nombre_completo).replace(',', ''))}</span>
        <div className="min-w-0">
          <h2 className="text-[17px] leading-tight font-extrabold">{nombrePersona(c.nombre_completo)}</h2>
          <p className="text-[13px] text-gris">{[c.cargo, c.area].filter(Boolean).map(nombrePersona).join(' · ') || 'Sin cargo'}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {c.estado === 'P' ? <Semaforo contrato={c} /> : <span className={`badge ${sit.clase}`}>{sit.texto}</span>}
        <span className={`text-[13px] font-semibold ${venc.color}`}>{venc.texto}</span>
        <span className="ml-auto text-[13px] text-gris">N° {c.cod_contrato}</span>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Dato etiqueta="Empresa">{nombreEmpresa(c.empresa_nombre)}</Dato>
        <Dato etiqueta="Tipo">{nombrePersona(c.des_tipo_contrato)}</Dato>
        <Dato etiqueta="Inicio">{fecha(c.fec_inicio)}</Dato>
        <Dato etiqueta="Fin">{fecha(c.fec_fin)}</Dato>
        <Dato etiqueta="Duración">{c.tip_contrato === 'IN' ? 'Indefinida' : textoDuracion(c.duracion !== null ? { meses: c.duracion, dias: c.dias ?? 0 } : null)}</Dato>
        <Dato etiqueta="Sueldo">{moneda(c.sueldo)}</Dato>
        <Dato etiqueta="DNI">{c.dni}</Dato>
        <Dato etiqueta="Origen">{INDICADOR[c.ind_contrato] ?? '—'}</Dato>
        {c.des_horario && <div className="col-span-2"><Dato etiqueta="Horario">{c.des_horario}</Dato></div>}
      </dl>

      {c.tip_contrato === 'AM' && <TopeModal dias={c.tiempo_modal_dias ?? 0} />}

      <Documentos c={c} />

      {data.evaluaciones.length > 0 && (
        <div>
          <div className="label">Evaluaciones</div>
          <ul className="mt-2 flex flex-col gap-1.5">
            {data.evaluaciones.slice(0, 4).map((e) => (
              <li key={e.periodo}>
                <Link
                  to={`/evaluaciones/${c.empresa}/${c.cod_personal}?periodo=${e.periodo}`}
                  className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm hover:bg-tinta/[0.04]"
                >
                  <span className="w-20 font-semibold">{periodoTexto(e.periodo)}</span>
                  <span className={`badge ${ESTADOS_EVALUACION[e.estado]?.clase ?? 'badge-neutro'}`}>{ESTADOS_EVALUACION[e.estado]?.texto ?? e.estado}</span>
                  <span className="ml-auto tabular-nums text-gris">{e.puntaje_total}/{e.puntaje_max}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <div className="label">Historial de contratos</div>
        <ol className="mt-2 flex flex-col gap-2.5">
          {data.historial.map((h) => (
            <li key={h.cod_contrato} className="flex gap-2.5">
              <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${h.estado === 'P' ? 'bg-ok' : h.estado === 'A' ? 'bg-gris-claro' : 'bg-gris'}`} />
              <div className="text-sm">
                <div className={`font-semibold ${h.cod_contrato === c.cod_contrato ? 'text-rojo-texto' : ''}`}>
                  N° {h.cod_contrato} · {ESTADO_HIST[h.estado] ?? 'Sin estado'} · {INDICADOR[h.ind_contrato] ?? '—'}
                </div>
                <div className="text-xs text-gris">{fecha(h.fec_inicio)} – {fecha(h.fec_fin)} · {moneda(h.sueldo)}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-col gap-2 border-t border-linea pt-4">
        {enProceso && c.tip_contrato !== 'IN' && (
          <Link
            to={`/evaluaciones/${c.empresa}/${c.cod_personal}${ultimaEval ? `?periodo=${ultimaEval.periodo}` : ''}`}
            className="btn btn-primary"
          >
            <Icon name="evaluacion" size={18} />
            {ultimaEval ? 'Ver evaluación' : 'Evaluar para renovar'}
          </Link>
        )}
        {gestionar && (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="btn btn-sm" onClick={() => onAccion('renovar', c)}><Icon name="renovar" size={16} />Renovar</button>
            <button type="button" className="btn btn-sm" onClick={() => onAccion('editar', c)}><Icon name="editar" size={16} />Editar</button>
            <button type="button" className="btn btn-sm" onClick={() => onAccion('cesar', c)}><Icon name="cese" size={16} />Registrar cese</button>
            <button type="button" className="btn btn-sm btn-peligro" onClick={() => onAccion('anular', c)}><Icon name="anular" size={16} />Anular</button>
          </div>
        )}
        {!enProceso && <p className="text-xs text-gris">Solo los contratos en proceso se pueden renovar, editar, anular o cesar.</p>}
      </div>
    </aside>
  );
}
