import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { EmpresaProvider } from '../context/EmpresaContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      // Los errores de negocio (4xx) no se reintentan; los de red, una vez.
      retry: (intentos, error) => !error?.response && intentos < 1,
    },
  },
});

export default function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <EmpresaProvider>{children}</EmpresaProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
