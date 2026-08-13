import api from './api';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  activo: boolean;
  turno?: string;
  dispositivo?: string;
  creadoEn?: string;
  ultimaActividad?: string;
  enLinea?: boolean;
  rol: {
    id: string;
    nombre: string;
    descripcion?: string;
  };
}

export interface Rol {
  id: string;
  nombre: string;
  descripcion?: string;
}

export const getUsuarios = async (): Promise<Usuario[]> => {
  const { data } = await api.get('/usuarios');
  if (data.success) {
    return data.data;
  }
  return [];
};

export const getRoles = async (): Promise<Rol[]> => {
  const { data } = await api.get('/usuarios/roles');
  if (data.success) {
    return data.data;
  }
  return [];
};

export const createUsuario = async (userData: {
  nombre: string;
  email: string;
  password: string;
  rolNombre: string;
  turno?: string;
  dispositivo?: string;
}) => {
  const { data } = await api.post('/usuarios', userData);
  return data;
};

export const updateUsuario = async (id: string, userData: {
  nombre?: string;
  email?: string;
  rolNombre?: string;
  turno?: string;
  dispositivo?: string;
}) => {
  const { data } = await api.put(`/usuarios/${id}`, userData);
  return data;
};

export const toggleUsuarioActivo = async (id: string) => {
  const { data } = await api.patch(`/usuarios/${id}/toggle-activo`);
  return data;
};

export const resetUsuarioPassword = async (id: string, newPassword: string) => {
  const { data } = await api.patch(`/usuarios/${id}/reset-password`, { newPassword });
  return data;
};
