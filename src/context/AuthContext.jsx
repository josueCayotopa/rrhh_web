import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setOnNoAutenticado, tokenStore } from '../api/client';
import * as authApi from '../api/endpoints/auth';

const AuthContext = createContext(null);

/** Sesión de la API RR.HH.: usuario, empresas permitidas y permisos. */
export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(null);
  const [cargando, setCargando] = useState(Boolean(tokenStore.get()));

  useEffect(() => {
    setOnNoAutenticado(() => setSesion(null));

    if (!tokenStore.get()) return;

    authApi
      .me()
      .then(setSesion)
      .catch(() => tokenStore.clear())
      .finally(() => setCargando(false));
  }, []);

  const login = useCallback(async (usuario, password) => {
    const datos = await authApi.login(usuario, password);
    tokenStore.set(datos.token);
    setSesion({ usuario: datos.usuario, empresas: datos.empresas, permisos: datos.permisos });
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // La sesión se cierra localmente aunque el servidor no responda.
    }
    tokenStore.clear();
    setSesion(null);
  }, []);

  const valor = useMemo(
    () => ({
      cargando,
      autenticado: Boolean(sesion),
      usuario: sesion?.usuario ?? null,
      empresas: sesion?.empresas ?? [],
      permisos: sesion?.permisos ?? [],
      puede: (permiso) => (sesion?.permisos ?? []).includes(permiso),
      login,
      logout,
    }),
    [cargando, sesion, login, logout],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
