import api from './api';

export const getAlertas = async (mostrarLeidas?: boolean) => {
  const { data } = await api.get('/alertas', {
    params: { mostrarLeidas: mostrarLeidas ? 'true' : 'false' }
  });
  return data;
};

export const getAlertasNoLeidas = async () => {
  return getAlertas(false);
};

export const marcarAlertaComoLeida = async (id: string) => {
  const { data } = await api.put(`/alertas/${id}/leer`);
  return data;
};

export const marcarTodasComoLeidas = async () => {
  const { data } = await api.put('/alertas/todas-leidas');
  return data;
};
