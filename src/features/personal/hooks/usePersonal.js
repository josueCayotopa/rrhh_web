import { useQuery } from '@tanstack/react-query';
import * as api from '../../../api/endpoints/personal';
import { useEmpresas } from '../../../context/EmpresaContext';

export function usePersonal(filtros) {
  const { seleccionadas } = useEmpresas();
  return useQuery({
    queryKey: ['personal', 'lista', seleccionadas, filtros],
    queryFn: () => api.getPersonal(seleccionadas, filtros),
    placeholderData: (previo) => previo,
  });
}

export function usePersonalResumen() {
  const { seleccionadas } = useEmpresas();
  return useQuery({
    queryKey: ['personal', 'resumen', seleccionadas],
    queryFn: () => api.getPersonalResumen(seleccionadas),
    placeholderData: (previo) => previo,
  });
}

export function useFichaPersonal(empresa, codPersonal) {
  const { seleccionadas } = useEmpresas();
  return useQuery({
    queryKey: ['personal', 'ficha', seleccionadas, empresa, codPersonal],
    queryFn: () => api.getFichaPersonal(seleccionadas, empresa, codPersonal),
    enabled: Boolean(empresa && codPersonal),
  });
}
