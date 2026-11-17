import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../../../api/endpoints/evaluaciones';
import { useEmpresas } from '../../../context/EmpresaContext';

export function useEvaluaciones(filtros) {
  const { seleccionadas } = useEmpresas();
  return useQuery({
    queryKey: ['evaluaciones', 'lista', seleccionadas, filtros],
    queryFn: () => api.getEvaluaciones(seleccionadas, filtros),
    placeholderData: (previo) => previo,
  });
}

export function useEvaluacionesResumen() {
  const { seleccionadas } = useEmpresas();
  return useQuery({
    queryKey: ['evaluaciones', 'resumen', seleccionadas],
    queryFn: () => api.getEvaluacionesResumen(seleccionadas),
    placeholderData: (previo) => previo,
  });
}

export function useEvaluacion(empresa, codPersonal, periodo) {
  return useQuery({
    queryKey: ['evaluaciones', 'detalle', empresa, codPersonal, periodo ?? 'ultimo'],
    queryFn: () => api.getEvaluacion(empresa, codPersonal, periodo),
    // El formulario se reinicia cuando llegan datos nuevos: no refrescar solo
    // al volver a la ventana para no perder lo que se está calificando.
    refetchOnWindowFocus: false,
  });
}

export function useUsuariosEvaluacion(empresa) {
  return useQuery({
    queryKey: ['evaluaciones', 'usuarios', empresa],
    queryFn: () => api.getUsuariosEvaluacion(empresa),
    enabled: Boolean(empresa),
    staleTime: 10 * 60 * 1000,
  });
}

/** Acciones (guardar, aprobar, renovar, anular): refrescan evaluaciones, contratos e inicio. */
export function useAccionEvaluacion(accion) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: accion,
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: ['evaluaciones'] });
      cliente.invalidateQueries({ queryKey: ['contratos'] });
      cliente.invalidateQueries({ queryKey: ['inicio'] });
    },
  });
}
