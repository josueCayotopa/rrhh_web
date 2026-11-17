import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppLayout from './layout/AppLayout';
import LoginPage from '../features/auth/pages/LoginPage';
import InicioPage from '../features/inicio/pages/InicioPage';
import EnConstruccionPage from '../features/inicio/pages/EnConstruccionPage';
import ContratosPage from '../features/contratos/pages/ContratosPage';
import EstructuraPage from '../features/estructura/pages/EstructuraPage';
import PersonalPage from '../features/personal/pages/PersonalPage';
import FichaPersonalPage from '../features/personal/pages/FichaPersonalPage';
import SolicitudesVacPage from '../features/vacaciones/pages/SolicitudesVacPage';
import VacacionesPersonalPage from '../features/vacaciones/pages/VacacionesPersonalPage';
import EvaluacionesPage from '../features/evaluaciones/pages/EvaluacionesPage';
import EvaluacionPage from '../features/evaluaciones/pages/EvaluacionPage';

function Protegida() {
  const { autenticado, cargando } = useAuth();

  if (cargando) {
    return <p className="p-10 text-center text-sm text-gris">Cargando sesión…</p>;
  }

  return autenticado ? <Outlet /> : <Navigate to="/login" replace />;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Protegida />}>
        <Route element={<AppLayout />}>
          <Route index element={<InicioPage />} />
          <Route path="personal" element={<PersonalPage />} />
          <Route path="personal/:empresa/:codPersonal" element={<FichaPersonalPage />} />
          <Route path="estructura" element={<EstructuraPage />} />
          <Route path="vacaciones/solicitudes" element={<SolicitudesVacPage />} />
          <Route path="vacaciones/personal" element={<VacacionesPersonalPage />} />
          <Route path="contratos" element={<ContratosPage />} />
          <Route path="evaluaciones" element={<EvaluacionesPage />} />
          <Route path="evaluaciones/:empresa/:codPersonal" element={<EvaluacionPage />} />
          {/* Los módulos aún no construidos caen aquí. */}
          <Route path="*" element={<EnConstruccionPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
