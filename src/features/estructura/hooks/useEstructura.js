import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../../../api/endpoints/estructura';
import { useEmpresas } from '../../../context/EmpresaContext';

export function useEstructura() {
  const { seleccionadas } = useEmpresas();
  return useQuery({
    queryKey: ['estructura', 'resumen', seleccionadas],
    queryFn: () => api.getEstructura(seleccionadas),
    placeholderData: (previo) => previo,
  });
}

export function usePersonalNodo(filtros) {
  const { seleccionadas } = useEmpresas();
  return useQuery({
    queryKey: ['estructura', 'personal', seleccionadas, filtros],
    queryFn: () => api.getPersonalNodo(seleccionadas, filtros),
    placeholderData: (previo) => previo,
  });
}

/** Asignación masiva: refresca estructura, evaluaciones, contratos ("por evaluar") e inicio. */
export function useAsignarEvaluaciones() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: api.asignarEvaluaciones,
    onSuccess: () => {
      ['estructura', 'evaluaciones', 'contratos', 'inicio'].forEach((k) => cliente.invalidateQueries({ queryKey: [k] }));
    },
  });
}
