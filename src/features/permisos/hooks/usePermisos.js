import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../../../api/endpoints/permisos';
import { useEmpresas } from '../../../context/EmpresaContext';

export function usePermisos(filtros) {
  const { seleccionadas } = useEmpresas();
  return useQuery({
    queryKey: ['permisos', 'lista', seleccionadas, filtros],
    queryFn: () => api.getPermisos(seleccionadas, filtros),
    placeholderData: (previo) => previo,
  });
}

export function usePermisosResumen() {
  const { seleccionadas } = useEmpresas();
  return useQuery({
    queryKey: ['permisos', 'resumen', seleccionadas],
    queryFn: () => api.getPermisosResumen(seleccionadas),
    placeholderData: (previo) => previo,
  });
}

export function usePermiso(empresa, id) {
  return useQuery({
    queryKey: ['permisos', 'detalle', empresa, id],
    queryFn: () => api.getPermiso(empresa, id),
    enabled: Boolean(empresa && id),
  });
}

export function useMotivosPermiso(empresa) {
  return useQuery({
    queryKey: ['permisos', 'motivos', empresa],
    queryFn: () => api.getMotivosPermiso(empresa),
    enabled: Boolean(empresa),
    staleTime: 600000,
  });
}

/** Toda acción refresca el módulo, la ficha del personal y el inicio. */
export function useAccionPermiso(accion) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: accion,
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: ['permisos'] });
      cliente.invalidateQueries({ queryKey: ['inicio'] });
    },
  });
}
