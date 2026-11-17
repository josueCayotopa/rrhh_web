import { Link, useLocation } from 'react-router-dom';
import { ESTADOS, MODULOS } from '../../../app/modulos';

/** Página temporal para los módulos que todavía no tienen pantalla. */
export default function EnConstruccionPage() {
  const { pathname } = useLocation();
  const modulo = MODULOS.find((m) => m.ruta === pathname);

  return (
    <section className="glass flex flex-col items-start gap-3 p-8">
      <span className={`badge ${ESTADOS[modulo?.estado ?? 'pendiente'].clase}`}>
        {ESTADOS[modulo?.estado ?? 'pendiente'].texto}
      </span>
      <h1 className="text-2xl font-extrabold tracking-tight">{modulo?.nombre ?? 'Página no encontrada'}</h1>
      <p className="max-w-xl text-sm text-gris">
        {modulo
          ? `${modulo.descripcion} Esta pantalla aún no está construida.`
          : 'La dirección no corresponde a ningún módulo.'}
      </p>
      <Link to="/" className="btn">
        Volver al inicio
      </Link>
    </section>
  );
}
