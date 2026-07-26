import api from './api';

export const getIncidentes = async (estado?: string) => {
  try {
    const query = estado ? `?estado=${estado}` : '';
    const response = await api.get(`/incidentes${query}`);
    if (response.data.success) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching incidentes', error);
    throw error;
  }
};

export const createIncidente = async (data: {
  terminal: string;
  stockCalculado: number;
  stockFisico: number;
  comentarios?: string;
}) => {
  try {
    const response = await api.post('/incidentes', data);
    return response.data;
  } catch (error) {
    console.error('Error creating incidente', error);
    throw error;
  }
};

export const updateIncidenteStatus = async (id: string, estado: string) => {
  try {
    const response = await api.patch(`/incidentes/${id}/estado`, { estado });
    return response.data;
  } catch (error) {
    console.error('Error updating incidente status', error);
    throw error;
  }
};
