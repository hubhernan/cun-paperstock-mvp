import api from './api';

export const getLotes = async () => {
  const { data } = await api.get('/lotes');
  return data;
};

export const createLote = async (loteData: { 
  tipoPapelId: string; 
  numeroLote: string; 
  fechaRecepcion?: string;
  fechaCaducidad?: string;
  almacenId?: string;
  cantidad?: number;
  usuarioId?: string;
}) => {
  const { data } = await api.post('/lotes', loteData);
  return data;
};

export const getLoteHistorial = async (loteId: string) => {
  const { data } = await api.get(`/lotes/${loteId}/historial`);
  return data;
};
