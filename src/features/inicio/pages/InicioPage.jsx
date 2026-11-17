import { Link } from 'react-router-dom';
import { ESTADOS, GRUPOS, solPendientes } from '../../../app/modulos';
import { mensajeError } from '../../../api/client';
import { useEmpresas } from '../../../context/EmpresaContext';
import { nombreEmpresa, numero } from '../../../lib/format';
import Icon from '../../../components/Icon';
import { useInicioResumen } from '../hooks/useInicioResumen';

const DIAS = 30;

/** Texto del ámbito: usa el nombre de la empresa, nunca el código de conexión. */
function useAmbito() {
  const { empresas, seleccionadas, todas } = useEmpresas();

  if (todas) return empresas.length === 1 ? nombreEmpresa(empresas[0].nombre) : `las ${empresas.length} empresas del grupo`;
  if (seleccionadas.length === 1) {
    return nombreEmpresa(empresas.find((e) => e.empresa === seleccionadas[0])?.nombre);
  }
  return `las ${seleccionadas.length} empresas elegidas`;
}

function Tarjeta({ titulo, valor, detalle, color = 'text-tinta', cargando }) {
  return (
    <div className="tile min-h-[132px]">
      <span className="label">{titulo}</span>
      {cargando ? (
        <span className="skeleton my-1.5 h-9 w-20" />
      ) : (
        <span className={`text-[38px] leading-tight font-extrabold tracking-tight ${color}`}>{numero(valor)}</span>
      )}
      <span className="text-[13px] text-gris">{detalle}</span>
    </div>
  );
}

function TablaEmpresas({ filas, cargando }) {
  const { soloUna } = useEmpresas();
  const maximo = Math.max(1, ...filas.map((f) => f.personal_activo ?? 0));

  return (
    <section aria-label="Detalle por empresa" className="glass min-w-0 flex-[999_1_560px] py-2">
      <div className="flex flex-wrap items-center gap-2.5 px-5 py-3">
        <h2 className="flex-[1_1_200px] text-[17px] font-extrabold">Por empresa</h2>
        <span className="text-[13px] text-gris">Clic en una empresa para ver solo esa</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-left text-[11px] tracking-wider text-gris uppercase">
              <th scope="col" className="border-b border-linea py-2.5 pr-3 pl-5 font-bold">Empresa</th>
              <th scope="col" className="min-w-[150px] border-b border-linea px-3 py-2.5 font-bold">Personal activo</th>
              <th scope="col" className="border-b border-linea px-3 py-2.5 text-right font-bold">Contratos por vencer</th>
              <th scope="col" className="border-b border-linea px-3 py-2.5 text-right font-bold">Solicitudes</th>
              <th scope="col" className="border-b border-linea py-2.5 pr-5 pl-3 text-right font-bold">Legajos</th>
            </tr>
          </thead>
          <tbody>
            {cargando &&
              [0, 1, 2].map((i) => (
                <tr key={i}>
                  <td colSpan={5} className="border-b border-linea px-5 py-3">
                    <span className="skeleton block h-5 w-full" />
                  </td>
                </tr>
              ))}
            {!cargando &&
              filas.map((f) => {
                const solicitudes = solPendientes(f);
                return (
                  <tr key={f.empresa} className="hover:bg-tinta/[0.03]">
                    <td className="border-b border-linea py-3 pr-3 pl-5">
                      <button
                        type="button"
                        className="cursor-pointer text-left font-bold hover:text-rojo-texto hover:underline"
                        onClick={() => soloUna(f.empresa)}
                      >
                        {nombreEmpresa(f.empresa_nombre)}
                      </button>
                    </td>
                    <td className="border-b border-linea px-3 py-3">
                      <div className="font-extrabold tabular-nums">{numero(f.personal_activo)}</div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gris/15">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-[#D63C3C] to-rojo-fuerte"
                          style={{ width: `${Math.round(((f.personal_activo ?? 0) / maximo) * 100)}%` }}
                        />
                      </div>
                    </td>
                    <Celda valor={f.contratos_por_vencer} className={f.contratos_por_vencer >= 8 ? 'text-aviso' : ''} />
                    <Celda valor={solicitudes} />
                    <Celda valor={f.legajos_por_vencer} className="pr-5!" />
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      {!cargando && filas.length === 0 && (
        <p className="px-5 py-7 text-center text-sm text-gris">No hay empresas en el ámbito elegido.</p>
      )}
    </section>
  );
}

function Celda({ valor, className = '' }) {
  return (
    <td
      className={`border-b border-linea px-3 py-3 text-right font-bold tabular-nums ${className}`}
      title={valor === null ? 'No aplica: la empresa no tiene este módulo' : undefined}
    >
      {numero(valor)}
    </td>
  );
}

/** Pendientes derivados de los indicadores por empresa (mismo SP, sin otra consulta). */
function construirPendientes(filas) {
  const lista = [];

  for (const f of filas) {
    const empresa = nombreEmpresa(f.empresa_nombre);

    if (f.sol_pendientes_rrhh > 0) {
      lista.push({ clave: `${f.empresa}-rrhh`, empresa, tag: 'Vacaciones', clase: 'badge-aviso', ruta: '/vacaciones/solicitudes', prioridad: 1,
        titulo: `${f.sol_pendientes_rrhh} ${f.sol_pendientes_rrhh === 1 ? 'solicitud espera' : 'solicitudes esperan'} a RR.HH.`, detalle: 'Ya aprobadas por el jefe' });
    }
    if (f.contratos_por_vencer_7 > 0) {
      lista.push({ clave: `${f.empresa}-c7`, empresa, tag: 'Contratos', clase: 'badge-aviso', ruta: '/contratos?situacion=POR_VENCER', prioridad: 2,
        titulo: `${f.contratos_por_vencer_7} ${f.contratos_por_vencer_7 === 1 ? 'contrato vence' : 'contratos vencen'} en 7 días`, detalle: 'Renovar o registrar cese' });
    }
    if (f.contratos_vencidos > 0) {
      lista.push({ clave: `${f.empresa}-cv`, empresa, tag: 'Contratos', clase: 'badge-aviso', ruta: '/contratos?situacion=VENCIDO_SIN_CERRAR', prioridad: 3,
        titulo: `${f.contratos_vencidos} ${f.contratos_vencidos === 1 ? 'contrato vencido' : 'contratos vencidos'} sin cerrar`, detalle: 'Siguen en proceso con fecha de fin pasada' });
    }
    if (f.sol_pendientes_jefe > 0) {
      lista.push({ clave: `${f.empresa}-jefe`, empresa, tag: 'Vacaciones', clase: 'badge-info', ruta: '/vacaciones/solicitudes', prioridad: 4,
        titulo: `${f.sol_pendientes_jefe} ${f.sol_pendientes_jefe === 1 ? 'solicitud espera' : 'solicitudes esperan'} al jefe`, detalle: 'RR.HH. puede aprobar directo' });
    }
    if (f.legajos_por_vencer > 0) {
      lista.push({ clave: `${f.empresa}-leg`, empresa, tag: 'Legajo', clase: 'badge-info', ruta: '/legajos', prioridad: 5,
        titulo: `${f.legajos_por_vencer} ${f.legajos_por_vencer === 1 ? 'documento vence' : 'documentos vencen'} en ${DIAS} días`, detalle: 'Documentos vigentes del legajo' });
    }
  }

  return lista.sort((a, b) => a.prioridad - b.prioridad);
}

function Pendientes({ filas, cargando }) {
  const pendientes = construirPendientes(filas);

  return (
    <aside aria-label="Pendientes" className="glass min-w-0 flex-[1_1_340px] p-5.5">
      <div className="flex items-center gap-2.5">
        <h2 className="flex-1 text-[17px] font-extrabold">Pendientes</h2>
        {!cargando && <span className="count">{pendientes.length}</span>}
      </div>
      {cargando && <span className="skeleton mt-3.5 block h-16 w-full" />}
      {!cargando && pendientes.length === 0 && (
        <p className="mt-3.5 text-sm text-gris">Sin pendientes en las empresas elegidas.</p>
      )}
      <ul className="mt-3.5 flex flex-col gap-2.5">
        {!cargando &&
          pendientes.map((p) => (
            <li key={p.clave}>
              <Link to={p.ruta} className="tile gap-1! rounded-2xl! px-3.5! py-3!">
                <span className="flex items-center gap-2">
                  <span className="count">{p.empresa}</span>
                  <span className={`badge ml-auto ${p.clase}`}>{p.tag}</span>
                </span>
                <span className="text-sm font-bold">{p.titulo}</span>
                <span className="text-xs text-gris">{p.detalle}</span>
              </Link>
            </li>
          ))}
      </ul>
    </aside>
  );
}

function Modulos({ totales }) {
  const indicadores = totales
    ? { ...totales, sol_pendientes: totales.sol_pendientes_jefe + totales.sol_pendientes_rrhh }
    : {};

  return (
    <section aria-label="Módulos" className="glass px-6 py-5.5">
      <h2 className="text-[17px] font-extrabold">Módulos</h2>
      {GRUPOS.map((grupo) => (
        <div key={grupo.nombre}>
          <div className="label mt-4.5">{grupo.nombre}</div>
          <div className="mt-2 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
            {grupo.modulos.map((m) => (
              <Link key={m.clave} to={m.ruta} className={`tile min-h-[132px] ${m.estado === 'listo' ? '' : 'tile-off'}`}>
                <span className="flex items-center gap-2 text-[15px] font-extrabold">
                  <Icon name={m.icono} size={18} className="text-rojo" />
                  <span className="flex-1">{m.nombre}</span>
                  {m.indicador && indicadores[m.indicador] > 0 && <span className="count">{numero(indicadores[m.indicador])}</span>}
                </span>
                <span className="flex-1 text-[13px] text-gris">{m.descripcion}</span>
                <span className={`badge self-start ${ESTADOS[m.estado].clase}`}>{ESTADOS[m.estado].texto}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

export default function InicioPage() {
  const ambito = useAmbito();
  const { data, isPending, isFetching, isError, error, refetch } = useInicioResumen(DIAS);

  const totales = data?.totales;
  const filas = data?.empresas ?? [];
  const nEmpresas = filas.length === 1 ? '1 empresa' : `${filas.length} empresas`;

  return (
    <>
      <section className="glass flex flex-wrap items-end gap-4 px-6 py-5">
        <div className="flex-[1_1_320px]">
          <h1 className="text-[28px] font-extrabold tracking-tight">Inicio</h1>
          <p className="mt-1 text-sm text-gris">Resumen de {ambito}.</p>
        </div>
        <button type="button" className="btn" onClick={() => refetch()} disabled={isFetching}>
          <Icon name="recargar" size={18} />
          {isFetching ? 'Actualizando…' : 'Actualizar'}
        </button>
      </section>

      {isError && (
        <section role="alert" className="glass flex flex-wrap items-center gap-3 px-5 py-4 text-sm">
          <Icon name="alerta" className="text-aviso" />
          <span className="flex-[1_1_260px] font-semibold">{mensajeError(error, 'No se pudo cargar el resumen.')}</span>
          <button type="button" className="btn" onClick={() => refetch()}>
            Reintentar
          </button>
        </section>
      )}

      <section aria-label="Resumen del ámbito" className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <Tarjeta titulo="Personal activo" valor={totales?.personal_activo} detalle={`en ${nEmpresas}`} cargando={isPending} />
        <Tarjeta titulo="Contratos por vencer" valor={totales?.contratos_por_vencer} detalle={`en los próximos ${DIAS} días`} color="text-aviso" cargando={isPending} />
        <Tarjeta
          titulo="Solicitudes por atender"
          valor={totales ? totales.sol_pendientes_jefe + totales.sol_pendientes_rrhh : undefined}
          detalle="vacaciones pendientes de aprobación"
          color="text-rojo-texto"
          cargando={isPending}
        />
        <Tarjeta titulo="Legajos por vencer" valor={totales?.legajos_por_vencer} detalle={`documentos en ${DIAS} días`} cargando={isPending} />
      </section>

      <div className="flex flex-wrap items-start gap-4">
        <TablaEmpresas filas={filas} cargando={isPending} />
        <Pendientes filas={filas} cargando={isPending} />
      </div>

      <Modulos totales={totales} />
    </>
  );
}
