import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../../../api/endpoints/contratos';
import { useEmpresas } from '../../../context/EmpresaContext';

export function useContratos(filtros) {
  const { seleccionadas } = useEmpresas();
  return useQuery({
    queryKey: ['contratos', 'lista', seleccionadas, filtros],
    queryFn: () => api.getContratos(seleccionadas, filtros),
    placeholderData: (previo) => previo,
  });
}

export function useContratosResumen() {
  const { seleccionadas } = useEmpresas();
  return useQuery({
    queryKey: ['contratos', 'resumen', seleccionadas],
    queryFn: () => api.getContratosResumen(seleccionadas),
    placeholderData: (previo) => previo,
  });
}

export function useContrato(clave) {
  return useQuery({
    queryKey: ['contratos', 'detalle', clave],
    queryFn: () => api.getContrato(clave),
    enabled: Boolean(clave),
  });
}

export function useTiposContrato() {
  const { seleccionadas } = useEmpresas();
  return useQuery({
    queryKey: ['catalogos', 'tipos-contrato', seleccionadas],
    queryFn: () => api.getTiposContrato(seleccionadas),
    staleTime: 30 * 60 * 1000,
  });
}

export function usePersonalDisponible(empresa, q) {
  return useQuery({
    queryKey: ['contratos', 'personal-disponible', empresa, q],
    queryFn: () => api.getPersonalDisponible(empresa, q),
    enabled: Boolean(empresa),
  });
}

/**
 * Acciones sobre contratos. Al terminar refresca listas, tarjetas, detalle,
 * inicio y evaluaciones (un cambio de contrato afecta "por evaluar").
 */
export function useAccionContrato(accion) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: accion,
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: ['contratos'] });
      cliente.invalidateQueries({ queryKey: ['evaluaciones'] });
      cliente.invalidateQueries({ queryKey: ['inicio'] });
    },
  });
}
