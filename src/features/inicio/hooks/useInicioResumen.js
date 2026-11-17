import { useQuery } from '@tanstack/react-query';
import { getInicioResumen } from '../../../api/endpoints/inicio';
import { useEmpresas } from '../../../context/EmpresaContext';

export function useInicioResumen(dias = 30) {
  const { seleccionadas } = useEmpresas();

  return useQuery({
    queryKey: ['inicio', 'resumen', seleccionadas, dias],
    queryFn: () => getInicioResumen(seleccionadas, dias),
    placeholderData: (previo) => previo, // mantiene los números mientras cambia el ámbito
  });
}
