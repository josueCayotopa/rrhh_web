import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

const EmpresaContext = createContext(null);
const STORAGE_KEY = 'rrhh_empresas';

function leerGuardadas() {
  try {
    const valor = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(valor) ? valor : [];
  } catch {
    return [];
  }
}

/**
 * Ámbito de empresas global. Afecta a todas las listas y tarjetas.
 * `seleccionadas` vacío significa "todas las empresas permitidas".
 */
export function EmpresaProvider({ children }) {
  const { empresas } = useAuth();
  const [seleccionadas, setSeleccionadas] = useState(leerGuardadas);

  // Descarta códigos guardados a los que el usuario ya no tiene acceso.
  const permitidas = useMemo(() => empresas.map((e) => e.empresa), [empresas]);
  const vigentes = useMemo(
    () => seleccionadas.filter((codigo) => permitidas.includes(codigo)),
    [seleccionadas, permitidas],
  );

  useEffect(() => {
    if (permitidas.length === 0) return; // aún sin sesión: no pisar lo guardado
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vigentes));
    } catch {
      // Sin almacenamiento local el ámbito solo dura la sesión del navegador.
    }
  }, [vigentes, permitidas]);

  const alternar = useCallback(
    (codigo) =>
      setSeleccionadas((actual) => {
        const base = actual.filter((c) => permitidas.includes(c));
        const nueva = base.includes(codigo) ? base.filter((c) => c !== codigo) : [...base, codigo];
        // Marcar todas una por una equivale a "todas".
        return nueva.length === permitidas.length ? [] : nueva;
      }),
    [permitidas],
  );

  const valor = useMemo(
    () => ({
      empresas,
      seleccionadas: vigentes,
      todas: vigentes.length === 0,
      alternar,
      soloUna: (codigo) => setSeleccionadas([codigo]),
      elegirTodas: () => setSeleccionadas([]),
    }),
    [empresas, vigentes, alternar],
  );

  return <EmpresaContext.Provider value={valor}>{children}</EmpresaContext.Provider>;
}

export const useEmpresas = () => useContext(EmpresaContext);
