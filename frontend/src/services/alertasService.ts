import api from './api';

export const getAlertasNoLeidas = async () => {
  const { data } = await api.get('/alertas');
  return data;
};

export const marcarAlertaComoLeida = async (id: string) => {
  const { data } = await api.put(`/alertas/${id}/leer`);
  return data;
};

export const marcarTodasComoLeidas = async () => {
  const { data } = await api.put('/alertas/todas-leidas');
  return data;
};
