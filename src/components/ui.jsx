import Icon from './Icon';
import { numero } from '../lib/format';

/** Tarjeta de indicador. `onClick` la vuelve botón (p. ej. filtra la lista). */
export function Indicador({ titulo, valor, detalle, color = 'text-tinta', acento, cargando, onClick, activo }) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      aria-pressed={onClick ? Boolean(activo) : undefined}
      className={`tile min-h-[124px] text-left ${onClick ? 'cursor-pointer hover:border-rojo' : ''} ${activo ? 'border-rojo!' : ''}`}
      style={acento ? { boxShadow: `inset 0 -3px 0 ${acento}, 0 1px 2px rgb(31 29 30 / 0.05)` } : undefined}
    >
      <span className="label">{titulo}</span>
      {cargando ? (
        <span className="skeleton my-1.5 h-9 w-20" />
      ) : (
        <span className={`text-[36px] leading-tight font-extrabold tracking-tight tabular-nums ${color}`}>{numero(valor)}</span>
      )}
      <span className="text-[13px] text-gris">{detalle}</span>
    </Comp>
  );
}

/** Pestañas de estado con contador (control segmentado). */
export function Segmentado({ opciones, valor, onCambio, etiqueta }) {
  return (
    <div className="seg" role="group" aria-label={etiqueta}>
      {opciones.map((o) => (
        <button key={o.valor} type="button" className="seg-item" aria-pressed={valor === o.valor} onClick={() => onCambio(o.valor)}>
          {o.texto}
          {o.total !== undefined && <span className="count">{numero(o.total)}</span>}
        </button>
      ))}
    </div>
  );
}

/** Paginación simple con resumen "1–25 de 296". */
export function Paginacion({ meta, onPagina }) {
  if (!meta || meta.total === 0) return null;
  const desde = (meta.page - 1) * meta.per_page + 1;
  const hasta = Math.min(meta.total, meta.page * meta.per_page);

  return (
    <div className="flex flex-wrap items-center gap-3 px-5 py-3 text-[13px] text-gris">
      <span className="flex-1">
        {numero(desde)}–{numero(hasta)} de {numero(meta.total)}
      </span>
      <button type="button" className="btn btn-sm" disabled={meta.page <= 1} onClick={() => onPagina(meta.page - 1)}>
        Anterior
      </button>
      <span>
        Página {meta.page} de {meta.last_page}
      </span>
      <button type="button" className="btn btn-sm" disabled={meta.page >= meta.last_page} onClick={() => onPagina(meta.page + 1)}>
        Siguiente
      </button>
    </div>
  );
}

/** Mensaje de éxito o error dentro de la página. */
export function Aviso({ aviso, onCerrar }) {
  if (!aviso) return null;
  const error = aviso.tipo === 'error';
  return (
    <div
      role={error ? 'alert' : 'status'}
      className={`glass flex items-center gap-3 px-5 py-3.5 text-sm font-semibold ${error ? 'text-rojo-texto' : 'text-ok'}`}
    >
      <Icon name={error ? 'alerta' : 'check'} />
      <span className="flex-1">{aviso.texto}</span>
      {onCerrar && (
        <button type="button" className="btn btn-icon btn-sm" onClick={onCerrar} aria-label="Cerrar mensaje">
          <Icon name="cerrar" size={16} />
        </button>
      )}
    </div>
  );
}

/** Error de formulario (dentro de un modal o sección). */
export function ErrorForm({ texto }) {
  if (!texto) return null;
  return (
    <p role="alert" className="rounded-2xl bg-rojo/10 px-4 py-3 text-sm font-semibold text-rojo-texto">
      {texto}
    </p>
  );
}

/** Campo con etiqueta. */
export function Campo({ etiqueta, ayuda, children, className = '' }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="label">{etiqueta}</span>
      {children}
      {ayuda && <span className="text-xs text-gris">{ayuda}</span>}
    </label>
  );
}

/** Fila de dato en fichas de detalle. */
export function Dato({ etiqueta, children }) {
  return (
    <div className="min-w-0">
      <dt className="label">{etiqueta}</dt>
      <dd className="mt-0.5 text-sm font-semibold break-words">{children ?? '—'}</dd>
    </div>
  );
}

/** Estado vacío de una lista. */
export function Vacio({ texto }) {
  return <p className="px-5 py-10 text-center text-sm text-gris">{texto}</p>;
}
