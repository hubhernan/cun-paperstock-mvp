import api from './api';

export const getLotes = async () => {
  const { data } = await api.get('/lotes');
  return data;
};

export const createLote = async (loteData: { tipoPapelId: string; numeroLote: string; fechaCaducidad?: string }) => {
  const { data } = await api.post('/lotes', loteData);
  return data;
};
