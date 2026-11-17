import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { mensajeError } from '../../../api/client';

export default function LoginPage() {
  const { autenticado, login } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (autenticado) return <Navigate to="/" replace />;

  async function onSubmit(evento) {
    evento.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await login(usuario.trim(), password);
    } catch (e) {
      setError(mensajeError(e, 'No se pudo iniciar sesión.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={onSubmit} className="glass flex w-full max-w-sm flex-col gap-4 p-8">
        <div className="flex items-center gap-3">
          <img src="/clinica_la_luz_isotipo.png" alt="" className="h-12 w-12 object-contain" />
          <div>
            <h1 className="text-xl leading-tight font-extrabold text-rojo-texto">Clínica La Luz</h1>
            <p className="text-sm font-semibold text-gris">Recursos Humanos</p>
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="label">Usuario</span>
          <input
            className="field"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            autoComplete="username"
            autoFocus
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="label">Contraseña</span>
          <input
            className="field"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && (
          <p role="alert" className="rounded-2xl bg-rojo/10 px-4 py-3 text-sm font-semibold text-rojo-texto">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary" disabled={enviando}>
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </button>

        <p className="text-center text-xs text-gris">Usa tu usuario y clave de la intranet.</p>
      </form>
    </div>
  );
}
