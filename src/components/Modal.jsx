import { useEffect, useRef } from 'react';
import Icon from './Icon';

/**
 * Diálogo modal nativo (<dialog>): atrapa el foco, Esc cierra y el fondo queda inerte.
 * Se monta solo cuando está abierto: {abierto && <Modal … />}.
 */
export default function Modal({ titulo, descripcion, onCerrar, children, pie, ancho = 'max-w-xl' }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialogo = ref.current;
    dialogo?.showModal();
    return () => dialogo?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCerrar();
      }}
      aria-labelledby="modal-titulo"
      className={`glass m-auto w-[calc(100%-32px)] ${ancho} max-h-[calc(100vh-32px)] overflow-hidden p-0 backdrop:bg-tinta/30 backdrop:backdrop-blur-[2px]`}
    >
      <div className="flex max-h-[calc(100vh-32px)] flex-col">
        <header className="flex items-start gap-3 border-b border-linea px-6 py-4">
          <div className="flex-1">
            <h2 id="modal-titulo" className="text-lg font-extrabold">{titulo}</h2>
            {descripcion && <p className="mt-0.5 text-sm text-gris">{descripcion}</p>}
          </div>
          <button type="button" className="btn btn-icon btn-sm" onClick={onCerrar} aria-label="Cerrar">
            <Icon name="cerrar" size={18} />
          </button>
        </header>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {pie && <footer className="flex flex-wrap justify-end gap-2 border-t border-linea px-6 py-4">{pie}</footer>}
      </div>
    </dialog>
  );
}
