import { api } from '../client';

export const login = (usuario, password) =>
  api.post('auth/login', { usuario, password }).then((r) => r.data.data);

export const me = () => api.get('auth/me').then((r) => r.data.data);

export const logout = () => api.post('auth/logout');
