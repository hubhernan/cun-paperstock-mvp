import api from './api';

export interface ReporteFilters {
  fechaInicio?: string;
  fechaFin?: string;
  areaId?: string;
  almacenId?: string;
  tipoMovimiento?: string;
  usuarioId?: string;
  estado?: string;
}

export const getReporteMovimientos = async (filters: ReporteFilters) => {
  const { data } = await api.get('/reportes/movimientos', { params: filters });
  return data;
};

export const getReporteStockValor = async () => {
  const { data } = await api.get('/reportes/valor-stock');
  return data;
};

export const getReporteConsumoArea = async (filters: ReporteFilters) => {
  const { data } = await api.get('/reportes/consumo-area', { params: filters });
  return data;
};

export const getReporteConsumoAlmacen = async (filters: ReporteFilters) => {
  const { data } = await api.get('/reportes/consumo-almacen', { params: filters });
  return data;
};

export const getReporteMovimientosIngeniero = async (filters: ReporteFilters) => {
  const { data } = await api.get('/reportes/movimientos-ingeniero', { params: filters });
  return data;
};

export const getReporteKioskosAbastecidos = async (filters: ReporteFilters) => {
  const { data } = await api.get('/reportes/kioskos-abastecidos', { params: filters });
  return data;
};

export const getReporteIncidentes = async (filters: ReporteFilters) => {
  const { data } = await api.get('/reportes/incidentes', { params: filters });
  return data;
};
