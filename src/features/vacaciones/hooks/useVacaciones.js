import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../../../api/endpoints/vacaciones';
import { useEmpresas } from '../../../context/EmpresaContext';

export function useSolicitudesVac(filtros) {
  const { seleccionadas } = useEmpresas();
  return useQuery({
    queryKey: ['vacaciones', 'solicitudes', seleccionadas, filtros],
    queryFn: () => api.getSolicitudesVac(seleccionadas, filtros),
    placeholderData: (previo) => previo,
  });
}

export function useSolicitudesVacResumen() {
  const { seleccionadas } = useEmpresas();
  return useQuery({
    queryKey: ['vacaciones', 'solicitudes-resumen', seleccionadas],
    queryFn: () => api.getSolicitudesVacResumen(seleccionadas),
    placeholderData: (previo) => previo,
  });
}

export function useSolicitudVac(clave) {
  return useQuery({
    queryKey: ['vacaciones', 'solicitud', clave],
    queryFn: () => api.getSolicitudVac(clave),
    enabled: Boolean(clave),
  });
}

export function useVacacionesPersonal(filtros) {
  const { seleccionadas } = useEmpresas();
  return useQuery({
    queryKey: ['vacaciones', 'personal', seleccionadas, filtros],
    queryFn: () => api.getVacacionesPersonal(seleccionadas, filtros),
    placeholderData: (previo) => previo,
  });
}

export function useVacacionesResumen() {
  const { seleccionadas } = useEmpresas();
  return useQuery({
    queryKey: ['vacaciones', 'personal-resumen', seleccionadas],
    queryFn: () => api.getVacacionesResumen(seleccionadas),
    placeholderData: (previo) => previo,
  });
}

export function useVacacionesTrabajador(empresa, codPersonal) {
  return useQuery({
    queryKey: ['vacaciones', 'trabajador', empresa, codPersonal],
    queryFn: () => api.getVacacionesTrabajador(empresa, codPersonal),
    enabled: Boolean(empresa && codPersonal),
  });
}

/** Cualquier acción de vacaciones refresca el módulo y el inicio. */
export function useAccionVacaciones(accion) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: accion,
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: ['vacaciones'] });
      cliente.invalidateQueries({ queryKey: ['inicio'] });
    },
  });
}
