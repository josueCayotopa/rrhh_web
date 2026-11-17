import { useState } from 'react';
import Modal from '../../../components/Modal';
import Icon from '../../../components/Icon';
import { Campo, ErrorForm } from '../../../components/ui';
import { mensajeError } from '../../../api/client';
import { registrarVacaciones } from '../../../api/endpoints/vacaciones';
import { hoyIso, moneda, nombrePersona } from '../../../lib/format';
import { MONEDAS, TIPOS, diasEntre, tramosPorMes } from '../constantes';
import { useAccionVacaciones } from '../hooks/useVacaciones';

const tramoVacio = () => {
  const hoy = hoyIso();
  return tramosPorMes(hoy, hoy, 'VN', '', '')[0];
};

/**
 * Registrar vacaciones en planilla: cabecera (año/mes de proceso, moneda,
 * transferencia) + tramos. Desde una solicitud aprobada llega precargado con un
 * tramo por mes calendario (como "pasar a planilla" de la web actual).
 */
export default function RegistrarVacacionesModal({ empresa, codPersonal, nombre, solicitud, onCerrar, onHecho }) {
  const [tramos, setTramos] = useState(() =>
    solicitud
      ? tramosPorMes(solicitud.fec_inicio, solicitud.fec_final, solicitud.tip_vacaciones, solicitud.imp_adelanto_vacac, solicitud.periodo_vac)
      : [tramoVacio()],
  );
  const [ano, setAno] = useState(solicitud?.ano_proceso ?? Number(hoyIso().slice(0, 4)));
  const [mes, setMes] = useState(solicitud?.mes_proceso ?? Number(hoyIso().slice(5, 7)));
  const [monedaSel, setMoneda] = useState('01');
  const [transf, setTransf] = useState('S');
  const [impTotal, setImpTotal] = useState('');
  const [fecAdela, setFecAdela] = useState('');
  const [error, setError] = useState('');

  const mut = useAccionVacaciones((cuerpo) => registrarVacaciones(empresa, codPersonal, cuerpo));
  const totalDias = tramos.reduce((s, t) => s + diasEntre(t.fec_inicio, t.fec_final), 0);
  const totalImp = tramos.reduce((s, t) => s + Number(t.imp_adelanto_vacac || 0), 0);

  const cambiar = (i, campo, valor) => setTramos((l) => l.map((t, j) => (j === i ? { ...t, [campo]: valor } : t)));

  function enviar(e) {
    e.preventDefault();
    setError('');
    mut.mutate(
      {
        ano_proceso: Number(ano),
        mes_proceso: Number(mes),
        cod_moneda: monedaSel,
        ind_transf_plan: transf,
        imp_tot_vacacion: impTotal === '' ? null : Number(impTotal),
        fec_adela: fecAdela || null,
        cod_corr_sol: solicitud?.cod_corr_sol ?? null,
        tramos: tramos.map((t) => ({
          fec_inicio: t.fec_inicio,
          fec_final: t.fec_final,
          tip_vacaciones: t.tip_vacaciones,
          per_desde: t.per_desde === '' ? null : Number(t.per_desde),
          per_hasta: t.per_hasta === '' ? null : Number(t.per_hasta),
          ano_aplica: Number(t.fec_inicio.slice(0, 4)),
          mes_aplica: Number(t.fec_inicio.slice(5, 7)),
          imp_adelanto_vacac: t.imp_adelanto_vacac === '' || t.imp_adelanto_vacac === null ? null : Number(t.imp_adelanto_vacac),
        })),
      },
      { onSuccess: (r) => onHecho(r.message), onError: (err) => setError(mensajeError(err, 'No se pudo registrar.')) },
    );
  }

  return (
    <Modal
      titulo="Registrar vacaciones en planilla"
      descripcion={`${nombrePersona(nombre)}${solicitud ? ` · solicitud N° ${solicitud.cod_corr_sol} de la intranet` : ''}`}
      onCerrar={onCerrar}
      ancho="max-w-4xl"
      pie={
        <>
          <span className="mr-auto self-center text-sm font-semibold">{totalDias} días · {moneda(totalImp || null)}</span>
          <button type="button" className="btn" onClick={onCerrar}>Cancelar</button>
          <button type="submit" form="form-registrar" className="btn btn-primary" disabled={mut.isPending}>
            {mut.isPending ? 'Registrando…' : 'Registrar'}
          </button>
        </>
      }
    >
      <form id="form-registrar" onSubmit={enviar} className="flex flex-col gap-4">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
          <Campo etiqueta="Año de proceso">
            <input className="field" type="number" min="2000" max="2100" value={ano} onChange={(e) => setAno(e.target.value)} required />
          </Campo>
          <Campo etiqueta="Mes de proceso">
            <select className="field" value={mes} onChange={(e) => setMes(e.target.value)}>
              {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{String(i + 1).padStart(2, '0')}</option>)}
            </select>
          </Campo>
          <Campo etiqueta="Moneda">
            <select className="field" value={monedaSel} onChange={(e) => setMoneda(e.target.value)}>
              {MONEDAS.map((m) => <option key={m.valor} value={m.valor}>{m.texto}</option>)}
            </select>
          </Campo>
          <Campo etiqueta="Transferir a planilla">
            <select className="field" value={transf} onChange={(e) => setTransf(e.target.value)}>
              <option value="S">Sí</option>
              <option value="N">No</option>
            </select>
          </Campo>
          <Campo etiqueta="Importe total" ayuda="Vacío = suma de adelantos.">
            <input className="field" type="number" min="0" step="0.01" value={impTotal} onChange={(e) => setImpTotal(e.target.value)} />
          </Campo>
          <Campo etiqueta="Fecha de adelanto">
            <input className="field" type="date" value={fecAdela} onChange={(e) => setFecAdela(e.target.value)} />
          </Campo>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h3 className="flex-1 text-[15px] font-extrabold">Tramos</h3>
            <button type="button" className="btn btn-sm" onClick={() => setTramos((l) => [...l, tramoVacio()])}>
              <Icon name="mas" size={16} /> Agregar tramo
            </button>
          </div>
          <div className="mt-2 overflow-x-auto">
            <table className="tbl min-w-[760px]">
              <thead>
                <tr>
                  <th scope="col">Inicio</th><th scope="col">Fin</th><th scope="col">Días</th><th scope="col">Tipo</th>
                  <th scope="col">Período (desde–hasta)</th><th scope="col">Adelanto</th><th scope="col"><span className="sr-only">Quitar</span></th>
                </tr>
              </thead>
              <tbody>
                {tramos.map((t, i) => (
                  <tr key={i}>
                    <td><input className="field min-h-[36px]!" type="date" aria-label={`Inicio del tramo ${i + 1}`} value={t.fec_inicio} onChange={(e) => cambiar(i, 'fec_inicio', e.target.value)} required /></td>
                    <td><input className="field min-h-[36px]!" type="date" aria-label={`Fin del tramo ${i + 1}`} value={t.fec_final} min={t.fec_inicio} onChange={(e) => cambiar(i, 'fec_final', e.target.value)} required /></td>
                    <td className="font-bold tabular-nums">{diasEntre(t.fec_inicio, t.fec_final)}</td>
                    <td>
                      <select className="field min-h-[36px]!" aria-label={`Tipo del tramo ${i + 1}`} value={t.tip_vacaciones} onChange={(e) => cambiar(i, 'tip_vacaciones', e.target.value)}>
                        {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v.largo}</option>)}
                      </select>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <input className="field min-h-[36px]! w-[82px]!" type="number" min="1990" max="2100" placeholder="Desde" aria-label={`Período desde, tramo ${i + 1}`} value={t.per_desde} onChange={(e) => cambiar(i, 'per_desde', e.target.value)} />
                        <input className="field min-h-[36px]! w-[82px]!" type="number" min="1990" max="2100" placeholder="Hasta" aria-label={`Período hasta, tramo ${i + 1}`} value={t.per_hasta} onChange={(e) => cambiar(i, 'per_hasta', e.target.value)} />
                      </div>
                    </td>
                    <td><input className="field min-h-[36px]! w-[110px]!" type="number" min="0" step="0.01" aria-label={`Adelanto del tramo ${i + 1}`} value={t.imp_adelanto_vacac ?? ''} onChange={(e) => cambiar(i, 'imp_adelanto_vacac', e.target.value)} /></td>
                    <td>
                      <button type="button" className="btn btn-icon btn-sm" aria-label={`Quitar tramo ${i + 1}`} disabled={tramos.length === 1}
                        onClick={() => setTramos((l) => l.filter((_, j) => j !== i))}>
                        <Icon name="cerrar" size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-gris">Un tramo por mes calendario. Si el período no se indica, se usa el año del tramo (como la web actual).</p>
        </div>
        <ErrorForm texto={error} />
      </form>
    </Modal>
  );
}
