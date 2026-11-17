import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon from '../../../components/Icon';
import { Dato, Vacio } from '../../../components/ui';
import { mensajeError } from '../../../api/client';
import { useAuth } from '../../../context/AuthContext';
import { fecha, iniciales, nombreEmpresa, nombrePersona, numero, periodoTexto } from '../../../lib/format';
import Semaforo from '../../contratos/components/Semaforo';
import { SITUACIONES, textoVencimiento } from '../../contratos/constantes';
import { ESTADOS_EVALUACION, textoRecomendacion } from '../../evaluaciones/constantes';
import { contratoEnProceso, ESTADOS_CIVILES, ESTADOS_PERSONAL, SEXOS, tiempoServicio } from '../constantes';
import { useFichaPersonal } from '../hooks/usePersonal';

function Seccion({ titulo, extra, children }) {
  return (
    <section className="glass flex min-w-0 flex-col gap-3 p-5.5" aria-label={titulo}>
      <div className="flex items-baseline gap-2">
        <h2 className="flex-1 text-[16px] font-extrabold">{titulo}</h2>
        {extra}
      </div>
      {children}
    </section>
  );
}

/** Un vínculo de la persona con una empresa del grupo. */
function Vinculo({ v }) {
  const est = ESTADOS_PERSONAL[v.estado] ?? { texto: v.estado, clase: 'badge-neutro' };
  const contrato = contratoEnProceso(v);
  return (
    <article className={`glass-soft flex flex-col gap-3 px-4.5 py-4 ${v.estado !== 'AC' ? 'opacity-80' : ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="flex-1 text-[15px] font-extrabold">{nombreEmpresa(v.empresa_nombre)}</h3>
        <span className={`badge ${est.clase}`}>{est.texto}</span>
      </div>
      <dl className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-x-4 gap-y-3">
        <Dato etiqueta="Código de personal"><span className="font-mono text-base">{v.cod_personal}</span></Dato>
        <Dato etiqueta="Planilla">{v.des_tipo_planilla ? nombrePersona(v.des_tipo_planilla) : null}</Dato>
        <Dato etiqueta="Cargo">
          {v.cargo ? nombrePersona(v.cargo) : null}
          {v.directivo && <span className="badge badge-info ml-1.5 px-1.5! py-0! text-[10px]!">Directivo</span>}
          {v.per_confianza && <span className="badge badge-neutro ml-1.5 px-1.5! py-0! text-[10px]!">Confianza</span>}
        </Dato>
        <Dato etiqueta="Área">{v.area ? nombrePersona(v.area) : null}</Dato>
        <Dato etiqueta="Sede">{v.sede ? nombrePersona(v.sede) : null}</Dato>
        <Dato etiqueta="Ingreso">{fecha(v.fec_ingreso)} <span className="font-normal text-gris">· {tiempoServicio(v.dias_servicio)}</span></Dato>
        {v.estado !== 'AC' && <Dato etiqueta="Cese">{fecha(v.fec_cese)}{v.motivo_cese ? <span className="block font-normal text-gris">{nombrePersona(v.motivo_cese)}</span> : null}</Dato>}
        <Dato etiqueta="Usuario del sistema">{v.usuario_erp ? <span className="font-mono">{v.usuario_erp}</span> : <span className="text-gris">Sin usuario</span>}</Dato>
        <Dato etiqueta="Usuario intranet">
          {v.usuario_intranet
            ? <><span className="font-mono">{v.usuario_intranet}</span>{!v.intranet_activo && <span className="badge badge-neutro ml-1.5 px-1.5! py-0! text-[10px]!">Inactivo</span>}
              {v.intranet_empresa && v.intranet_empresa !== v.empresa && <span className="block text-xs font-normal text-gris">cuenta creada en {v.intranet_empresa}</span>}</>
            : <span className="text-aviso">Sin usuario</span>}
        </Dato>
        <Dato etiqueta="Jefe">
          {v.jefe_usuario
            ? <>{nombrePersona(v.jefe_nombre ?? v.jefe_usuario)}
              <span className="block text-xs font-normal text-gris">
                {v.jefe_cod_personal ? `Cód. ${v.jefe_cod_personal}` : 'Sin código'}{v.jefe_empresa ? ` · ${v.jefe_empresa}` : ''} · {v.jefe_usuario}
              </span></>
            : <span className={v.estado === 'AC' ? 'text-aviso' : 'text-gris'}>Sin jefe asignado</span>}
        </Dato>
        <Dato etiqueta="Contrato en proceso">
          {contrato ? <Semaforo contrato={contrato} />
            : v.situacion_contrato === 'SIN_CONTRATO' && v.lleva_contrato ? <span className="text-rojo-texto">Sin contrato</span>
              : <span className="text-gris">{v.estado === 'AC' ? 'No aplica a su planilla' : '—'}</span>}
          {v.contrato_fec_fin && v.situacion_contrato !== 'INDETERMINADO' && <span className="block text-xs font-normal text-gris">{fecha(v.contrato_fec_inicio)} – {fecha(v.contrato_fec_fin)}</span>}
        </Dato>
        {v.legajo_docs !== null && <Dato etiqueta="Legajo">{numero(v.legajo_docs)} documentos</Dato>}
      </dl>
    </article>
  );
}

export default function FichaPersonalPage() {
  const { empresa, codPersonal } = useParams();
  const navigate = useNavigate();
  const { puede } = useAuth();
  const { data, isPending, isError, error } = useFichaPersonal(empresa, codPersonal);

  const volver = (
    <button type="button" className="btn btn-sm" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/personal'))}>
      <Icon name="volver" size={16} /> Personal
    </button>
  );

  if (isPending) {
    return (
      <section className="glass flex flex-col gap-3 p-6" aria-busy="true">
        <span className="skeleton h-10 w-1/2" /><span className="skeleton h-32 w-full" /><span className="skeleton h-48 w-full" />
      </section>
    );
  }
  if (isError) {
    return (
      <section className="glass flex flex-col items-start gap-3 p-6">
        {volver}
        <p role="alert" className="text-sm font-semibold text-rojo-texto">{mensajeError(error)}</p>
      </section>
    );
  }

  const { persona, vinculos, contratos, evaluaciones, vacaciones } = data;
  const nombre = nombrePersona(persona.nombre_completo);
  const busqueda = encodeURIComponent(persona.dni ?? codPersonal);
  const saldoTotal = vacaciones.reduce((s, v) => s + (v.saldo ?? 0), 0);

  return (
    <>
      <section className="glass flex flex-wrap items-center gap-4 px-6 py-5">
        <div className="flex w-full items-center gap-2 text-[13px] font-medium text-gris">
          <nav aria-label="Ruta" className="flex-1">Organización › <Link to="/personal" className="hover:underline">Personal</Link> › <span className="font-semibold text-tinta">Ficha</span></nav>
          {volver}
        </div>
        <span className="avatar h-16! w-16! text-xl!">{iniciales(nombre.replace(',', ''))}</span>
        <div className="min-w-0 flex-[1_1_320px]">
          <h1 className="text-[26px] leading-tight font-extrabold tracking-tight">{nombre}</h1>
          <p className="mt-1 text-sm text-gris">
            {persona.dni ? `DNI ${persona.dni}` : 'Sin DNI'}
            {persona.cargo ? ` · ${nombrePersona(persona.cargo)}` : ''}
            {persona.empresa_nombre ? ` · ${nombreEmpresa(persona.empresa_nombre)}` : ''}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className={`badge ${persona.activo_en > 0 ? 'badge-ok' : 'badge-neutro'}`}>
              {persona.activo_en > 0 ? `Activo en ${persona.activo_en} ${persona.activo_en === 1 ? 'empresa' : 'empresas'}` : 'Cesado'}
            </span>
            {persona.empresas > 1 && <span className="badge badge-info">{persona.empresas} vínculos con el grupo</span>}
            {persona.usuario_intranet
              ? <span className="badge badge-neutro">Intranet: {persona.usuario_intranet}{!persona.intranet_activo ? ' (inactivo)' : ''}</span>
              : <span className="badge badge-aviso">Sin usuario de intranet</span>}
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <Seccion titulo={`Empresas (${vinculos.length})`}>
          <div className="flex flex-col gap-3">
            {vinculos.map((v) => <Vinculo key={`${v.empresa}|${v.cod_personal}`} v={v} />)}
          </div>
        </Seccion>

        <div className="flex min-w-0 flex-col gap-4">
          <Seccion titulo="Datos personales">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Dato etiqueta="Nacimiento">{persona.fec_nacimiento ? <>{fecha(persona.fec_nacimiento)} <span className="font-normal text-gris">· {persona.edad} años</span></> : null}</Dato>
              <Dato etiqueta="Sexo">{SEXOS[persona.sexo] ?? persona.sexo}</Dato>
              <Dato etiqueta="Estado civil">{ESTADOS_CIVILES[persona.estado_civil] ?? persona.estado_civil}</Dato>
              <Dato etiqueta="Teléfono">{persona.telefono}</Dato>
              <div className="col-span-2"><Dato etiqueta="Correo">{persona.email}</Dato></div>
              <div className="col-span-2"><Dato etiqueta="Dirección">{persona.direccion ? nombrePersona(persona.direccion) : null}</Dato></div>
              <Dato etiqueta="Primer ingreso al grupo">{fecha(persona.primer_ingreso)}</Dato>
            </dl>
            <p className="text-xs text-gris">Datos del legajo de {nombreEmpresa(persona.empresa_nombre)} (MAE_AUXILIAR / PLA_PERSONAL).</p>
          </Seccion>

          <Seccion titulo="Vacaciones" extra={vacaciones.length > 1 && <span className="text-sm">Total <strong className="tabular-nums">{numero(saldoTotal)}</strong> días</span>}>
            {vacaciones.length === 0 && <p className="text-sm text-gris">No lleva saldo de vacaciones (solo personal activo de planilla 01-03).</p>}
            <ul className="flex flex-col gap-2">
              {vacaciones.map((v) => (
                <li key={v.empresa} className="glass-soft flex items-center gap-3 px-3.5 py-2.5 text-[13px]">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{nombreEmpresa(v.empresa_nombre)}</div>
                    <div className="text-xs text-gris">
                      {numero(v.dias_ganados)} ganados · {numero(v.dias_usados)} usados{v.dias_solicitados > 0 ? ` · ${numero(v.dias_solicitados)} solicitados` : ''}
                      {v.ultimo_fin ? ` · último goce ${fecha(v.ultimo_fin)}` : ''}
                    </div>
                  </div>
                  <span className={`text-lg font-extrabold tabular-nums ${v.saldo < 0 || v.saldo >= 60 ? 'text-rojo-texto' : v.saldo >= 30 ? 'text-aviso' : ''}`}>{numero(v.saldo)}</span>
                  {puede('vacaciones.ver') && (
                    <Link className="btn btn-sm" to={`/vacaciones/personal?empresa=${encodeURIComponent(v.empresa)}&cod=${encodeURIComponent(v.cod_personal)}`} aria-label={`Ver vacaciones en ${nombreEmpresa(v.empresa_nombre)}`}>
                      <Icon name="flecha" size={14} />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </Seccion>
        </div>
      </div>

      <Seccion titulo={`Contratos (${contratos.length})`}
        extra={puede('contratos.ver') && contratos.length > 0 && <Link className="btn btn-sm" to={`/contratos?situacion=&q=${busqueda}`}>Ver en Contratos</Link>}>
        {contratos.length === 0 ? <Vacio texto="Sin contratos registrados." /> : (
          <div className="-mx-5.5 overflow-x-auto">
            <table className="tbl min-w-[720px]">
              <thead>
                <tr>
                  <th scope="col" className="pl-5.5!">Empresa</th><th scope="col">N°</th><th scope="col">Tipo</th>
                  <th scope="col">Vigencia</th><th scope="col">Situación</th><th scope="col" className="pr-5.5!">Firmado</th>
                </tr>
              </thead>
              <tbody>
                {contratos.map((c) => {
                  const venc = textoVencimiento(c);
                  return (
                    <tr key={`${c.empresa}|${c.cod_personal}|${c.cod_contrato}`}>
                      <td className="pl-5.5! text-[13px]">{nombreEmpresa(c.empresa_nombre)}<div className="text-xs text-gris">cód. {c.cod_personal}</div></td>
                      <td className="font-mono text-[13px]">{c.cod_contrato}</td>
                      <td className="text-[13px]">{nombrePersona(c.des_tipo_contrato ?? c.tip_contrato ?? '')}</td>
                      <td className="text-[13px] tabular-nums">{fecha(c.fec_inicio)} – {c.situacion === 'INDETERMINADO' ? 'indeterminado' : fecha(c.fec_fin)}
                        {c.estado === 'P' && <div className={`text-xs ${venc.color}`}>{venc.texto}</div>}</td>
                      <td>{c.estado === 'P' ? <Semaforo contrato={c} /> : <span className={`badge ${SITUACIONES[c.situacion]?.clase ?? 'badge-neutro'}`}>{SITUACIONES[c.situacion]?.texto ?? c.situacion}</span>}</td>
                      <td className="pr-5.5! text-[13px]">{c.tiene_archivo ? 'Archivo cargado' : c.ind_firmado === 'S' ? 'Sí' : <span className="text-gris">—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Seccion>

      <Seccion titulo={`Evaluaciones de desempeño (${evaluaciones.length})`}>
        {evaluaciones.length === 0 ? <Vacio texto="Sin evaluaciones registradas." /> : (
          <div className="-mx-5.5 overflow-x-auto">
            <table className="tbl min-w-[720px]">
              <thead>
                <tr>
                  <th scope="col" className="pl-5.5!">Período</th><th scope="col">Empresa</th><th scope="col">Estado</th>
                  <th scope="col" className="text-right">Puntaje</th><th scope="col">Recomendación</th><th scope="col">Aprobadores</th><th scope="col" className="pr-5.5!"><span className="sr-only">Abrir</span></th>
                </tr>
              </thead>
              <tbody>
                {evaluaciones.map((e) => {
                  const est = ESTADOS_EVALUACION[e.estado] ?? { texto: e.estado, clase: 'badge-neutro' };
                  return (
                    <tr key={`${e.empresa}|${e.cod_personal}|${e.periodo}`}>
                      <td className="pl-5.5! font-semibold">{periodoTexto(e.periodo)}</td>
                      <td className="text-[13px]">{nombreEmpresa(e.empresa_nombre)}</td>
                      <td><span className={`badge ${est.clase}`}>{est.texto}</span></td>
                      <td className="text-right tabular-nums">{numero(e.puntaje_total)}{e.puntaje_max ? <span className="text-gris"> / {numero(e.puntaje_max)}</span> : null}</td>
                      <td className="text-[13px]">{textoRecomendacion(e.recomendacion_final)}</td>
                      <td className="text-[13px]">{e.aprob_total ? `${e.aprob_aprobadas}/${e.aprob_total} aprobaron${e.aprob_rechazadas ? ` · ${e.aprob_rechazadas} rechazó` : ''}` : <span className="text-gris">—</span>}</td>
                      <td className="pr-5.5!">
                        {puede('evaluaciones.ver') && (
                          <Link className="btn btn-sm" to={`/evaluaciones/${encodeURIComponent(e.empresa)}/${encodeURIComponent(e.cod_personal)}?periodo=${e.periodo}`}>Abrir</Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Seccion>
    </>
  );
}
