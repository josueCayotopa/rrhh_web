import { semaforo } from '../constantes';

const LUCES = [
  { clave: 'rojo', color: '#C81E1E' },
  { clave: 'ambar', color: '#E9730C' },
  { clave: 'verde', color: '#178A47' },
];

/** Semáforo de tres luces + texto. El texto da el significado (no depende solo del color). */
export default function Semaforo({ contrato }) {
  const { luz, texto } = semaforo(contrato);

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span className="inline-flex gap-[3px] rounded-full bg-tinta/[0.07] p-[3px]" aria-hidden="true">
        {LUCES.map((l) => (
          <span
            key={l.clave}
            className="h-2.5 w-2.5 rounded-full"
            style={{
              background: luz === l.clave ? l.color : 'rgb(92 90 91 / 0.18)',
              boxShadow: luz === l.clave ? `0 0 6px ${l.color}` : 'none',
            }}
          />
        ))}
      </span>
      <span className={`text-[13px] font-semibold ${luz ? 'text-tinta' : 'text-gris'}`}>{texto}</span>
    </span>
  );
}
