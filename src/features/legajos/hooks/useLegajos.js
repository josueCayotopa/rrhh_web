import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../../../api/endpoints/legajos';
import { useEmpresas } from '../../../context/EmpresaContext';

export function useLegajos(filtros) {
  const { seleccionadas } = useEmpresas();
  return useQuery({
    queryKey: ['legajos', 'lista', seleccionadas, filtros],
    queryFn: () => api.getLegajos(seleccionadas, filtros),
    placeholderData: (previo) => previo,
  });
}

/** Solo el total (per_page=1) para las tarjetas. */
export function useLegajosTotal(filtros) {
  const { seleccionadas } = useEmpresas();
  return useQuery({
    queryKey: ['legajos', 'total', seleccionadas, filtros],
    queryFn: () => api.getLegajos(seleccionadas, { ...filtros, per_page: 1 }).then((r) => r.meta?.total ?? 0),
  });
}

export function useLegajosPorVencer(filtros) {
  const { seleccionadas } = useEmpresas();
  return useQuery({
    queryKey: ['legajos', 'por-vencer', seleccionadas, filtros],
    queryFn: () => api.getLegajosPorVencer(seleccionadas, filtros),
    placeholderData: (previo) => previo,
  });
}

export function useLegajo(empresa, codPersonal) {
  return useQuery({
    queryKey: ['legajos', 'detalle', empresa, codPersonal],
    queryFn: () => api.getLegajo(empresa, codPersonal),
    enabled: Boolean(empresa && codPersonal),
  });
}

export function useHistorialDoc(empresa, codPersonal, codTipoDoc) {
  return useQuery({
    queryKey: ['legajos', 'historial', empresa, codPersonal, codTipoDoc],
    queryFn: () => api.getHistorialDoc(empresa, codPersonal, codTipoDoc),
    enabled: Boolean(empresa && codPersonal && codTipoDoc),
  });
}

export function useTiposPlanilla() {
  return useQuery({ queryKey: ['catalogos', 'tipos-planilla'], queryFn: api.getTiposPlanilla, staleTime: 3600000 });
}

/** Cargar o dar de baja refresca legajos, la ficha del personal y el inicio. */
export function useAccionLegajo(accion) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: accion,
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: ['legajos'] });
      cliente.invalidateQueries({ queryKey: ['personal'] });
      cliente.invalidateQueries({ queryKey: ['inicio'] });
    },
  });
}
