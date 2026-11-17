import Icon from '../../../components/Icon';
import { fecha, numero } from '../../../lib/format';

/**
 * Saldo de vacaciones con la regla de la intranet: 30 días por año completo
 * cumplido desde el ingreso, menos lo registrado en planilla (goce y compra).
 */
export default function SaldoVacaciones({ saldo, diasSolicitud }) {
  if (!saldo) {
    return <p className="glass-soft px-4 py-3 text-sm text-gris">Sin saldo calculado: el trabajador no está activo en planilla de empleados, obreros o funcionarios.</p>;
  }

  const faltaHistorial = saldo.historial_desde && saldo.fec_ingreso
    && Number(saldo.historial_desde.slice(0, 4)) - Number(saldo.fec_ingreso.slice(0, 4)) >= 2;
  const despues = diasSolicitud ? saldo.saldo - diasSolicitud : null;

  return (
    <div className="glass-soft px-4 py-3.5">
      <div className="flex items-end gap-3">
        <div>
          <div className="label">Saldo</div>
          <div className={`text-[30px] leading-tight font-extrabold tabular-nums ${saldo.saldo < 0 ? 'text-rojo-texto' : saldo.saldo >= 30 ? 'text-aviso' : 'text-tinta'}`}>
            {numero(saldo.saldo)} <span className="text-sm font-semibold text-gris">días</span>
          </div>
        </div>
        {despues !== null && (
          <div className="ml-auto text-right text-[13px]">
            <div className="text-gris">Después de esta solicitud</div>
            <div className={`font-extrabold tabular-nums ${despues < 0 ? 'text-rojo-texto' : ''}`}>{numero(despues)} días</div>
          </div>
        )}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px] sm:grid-cols-4">
        <div><dt className="text-gris">Ganados</dt><dd className="font-bold tabular-nums">{numero(saldo.dias_ganados)} <span className="font-normal text-gris">({saldo.anios_completos} años)</span></dd></div>
        <div><dt className="text-gris">Gozados</dt><dd className="font-bold tabular-nums">{numero(saldo.dias_gozados)}</dd></div>
        <div><dt className="text-gris">Comprados</dt><dd className="font-bold tabular-nums">{numero(saldo.dias_comprados)}</dd></div>
        <div><dt className="text-gris">Solicitados en curso</dt><dd className="font-bold tabular-nums">{numero(saldo.dias_solicitados)}</dd></div>
      </dl>
      <p className="mt-2 text-xs text-gris">
        Ingreso {fecha(saldo.fec_ingreso)} · próximo aniversario {fecha(saldo.proximo_aniversario)} · último goce {fecha(saldo.ultimo_fin)}
      </p>
      {faltaHistorial && (
        <p className="mt-2 flex items-start gap-1.5 text-xs font-semibold text-aviso">
          <Icon name="alerta" size={14} className="mt-0.5" />
          El historial en el sistema empieza en {fecha(saldo.historial_desde)}: los años anteriores pueden inflar el saldo.
        </p>
      )}
    </div>
  );
}
