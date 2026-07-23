import React, { useState, useEffect } from 'react';
import { FileText, FileSpreadsheet } from 'lucide-react';
import { 
  getReporteMovimientos, 
  getReporteStockValor, 
  getReporteConsumoArea, 
  getReporteConsumoAlmacen 
} from '../services/reportesService';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';
import { format } from 'date-fns';
import api from '../services/api';

const Reportes: React.FC = () => {
  const [tipoReporte, setTipoReporte] = useState('movimientos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [areas, setAreas] = useState<any[]>([]);
  const [almacenes, setAlmacenes] = useState<any[]>([]);
  const [areaId, setAreaId] = useState('');
  const [almacenId, setAlmacenId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFiltros = async () => {
      try {
        const [resAreas, resAlmacenes] = await Promise.all([
          api.get('/areas'),
          api.get('/almacenes')
        ]);
        setAreas(resAreas.data);
        setAlmacenes(resAlmacenes.data);
      } catch (err) {
        console.error('Error cargando filtros', err);
      }
    };
    fetchFiltros();
  }, []);

  const handleExport = async (formatType: 'pdf' | 'excel') => {
    setLoading(true);
    setError('');
    try {
      let data = [];
      let columns: any[] = [];
      let title = '';
      let fileName = '';

      const filters = {
        fechaInicio,
        fechaFin,
        ...(areaId && { areaId }),
        ...(almacenId && { almacenId })
      };

      if (tipoReporte === 'movimientos') {
        data = await getReporteMovimientos(filters);
        title = 'Historial de Movimientos';
        fileName = 'reporte_movimientos';
        columns = [
          { header: 'Fecha', dataKey: 'fechaFormat' },
          { header: 'Tipo', dataKey: 'tipoMovimiento' },
          { header: 'Papel', dataKey: 'codigoPapel' },
          { header: 'Proveedor', dataKey: 'proveedor' },
          { header: 'Cantidad', dataKey: 'cantidad' },
          { header: 'Usuario', dataKey: 'usuarioNombre' },
        ];
        data = data.map((d: any) => {
          const provOrigen = d.almacenOrigen?.proveedor;
          const provDestino = d.almacenDestino?.proveedor;
          const provRelevante = d.tipoMovimiento === 'ENTRADA' ? provDestino : provOrigen;
          return {
            fechaFormat: format(new Date(d.fechaMovimiento), 'dd/MM/yyyy HH:mm'),
            tipoMovimiento: d.tipoMovimiento,
            codigoPapel: d.tipoPapel?.codigo || '',
            proveedor: provRelevante || '-',
            cantidad: d.cantidad,
            usuarioNombre: d.usuario?.nombre || ''
          };
        });
      } else if (tipoReporte === 'valorStock') {
        data = await getReporteStockValor();
        title = 'Valor de Stock Actual';
        fileName = 'reporte_valor_stock';
        columns = [
          { header: 'Código', dataKey: 'codigo' },
          { header: 'Descripción', dataKey: 'descripcion' },
          { header: 'Stock Total', dataKey: 'stockTotal' },
          { header: 'Costo Unit. ($)', dataKey: 'costoUnitario' },
          { header: 'Valor Total ($)', dataKey: 'valorTotal' },
        ];
      } else if (tipoReporte === 'consumoArea') {
        data = await getReporteConsumoArea(filters);
        title = 'Consumo por Área';
        fileName = 'reporte_consumo_area';
        columns = [
          { header: 'Fecha', dataKey: 'fechaFormat' },
          { header: 'Área', dataKey: 'areaNombre' },
          { header: 'Papel', dataKey: 'codigoPapel' },
          { header: 'Cantidad', dataKey: 'cantidad' },
        ];
        data = data.map((d: any) => ({
          fechaFormat: format(new Date(d.fechaAsignacion), 'dd/MM/yyyy HH:mm'),
          areaNombre: d.periferico?.area?.nombre || '',
          codigoPapel: d.tipoPapel?.codigo || '',
          cantidad: d.cantidadAsignada
        }));
      } else if (tipoReporte === 'consumoAlmacen') {
        data = await getReporteConsumoAlmacen(filters);
        title = 'Consumo (Salidas) por Almacén';
        fileName = 'reporte_consumo_almacen';
        columns = [
          { header: 'Fecha', dataKey: 'fechaFormat' },
          { header: 'Almacén', dataKey: 'almacenNombre' },
          { header: 'Proveedor', dataKey: 'proveedor' },
          { header: 'Papel', dataKey: 'codigoPapel' },
          { header: 'Cantidad', dataKey: 'cantidad' },
        ];
        data = data.map((d: any) => ({
          fechaFormat: format(new Date(d.fechaMovimiento), 'dd/MM/yyyy HH:mm'),
          almacenNombre: d.almacenOrigen?.nombre || '',
          proveedor: d.almacenOrigen?.proveedor || '-',
          codigoPapel: d.tipoPapel?.codigo || '',
          cantidad: d.cantidad
        }));
      }

      if (data.length === 0) {
        setError('No se encontraron registros para los filtros seleccionados.');
        setLoading(false);
        return;
      }

      if (formatType === 'pdf') {
        exportToPDF(title, columns, data, fileName);
      } else {
        exportToExcel(data, title, fileName);
      }

    } catch (err) {
      console.error(err);
      setError('Ocurrió un error al generar el reporte.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="text-blue-400" />
          Módulo de Reportes Avanzados
        </h1>
      </div>

      {error && <div className="bg-red-500/20 text-red-300 p-3 rounded mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Tipo de Reporte</label>
          <select 
            value={tipoReporte} 
            onChange={(e) => setTipoReporte(e.target.value)}
            className="input-field w-full"
          >
            <option value="movimientos">Historial de Movimientos</option>
            <option value="valorStock">Valor de Stock Actual</option>
            <option value="consumoArea">Consumo por Área</option>
            <option value="consumoAlmacen">Consumo por Almacén</option>
          </select>
        </div>

        {tipoReporte !== 'valorStock' && (
          <>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Fecha Inicio</label>
              <input 
                type="date" 
                value={fechaInicio} 
                onChange={(e) => setFechaInicio(e.target.value)} 
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Fecha Fin</label>
              <input 
                type="date" 
                value={fechaFin} 
                onChange={(e) => setFechaFin(e.target.value)} 
                className="input-field w-full"
              />
            </div>
          </>
        )}

        {tipoReporte === 'consumoArea' && (
          <div>
            <label className="block text-sm text-gray-400 mb-1">Filtrar por Área</label>
            <select 
              value={areaId} 
              onChange={(e) => setAreaId(e.target.value)}
              className="input-field w-full"
            >
              <option value="">Todas las Áreas</option>
              {areas.map(a => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
          </div>
        )}

        {tipoReporte === 'consumoAlmacen' && (
          <div>
            <label className="block text-sm text-gray-400 mb-1">Filtrar por Almacén</label>
            <select 
              value={almacenId} 
              onChange={(e) => setAlmacenId(e.target.value)}
              className="input-field w-full"
            >
              <option value="">Todos los Almacenes</option>
              {almacenes.map(a => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button 
          className="btn btn-primary flex items-center gap-2"
          onClick={() => handleExport('pdf')}
          disabled={loading}
        >
          <FileText size={20} />
          {loading ? 'Generando...' : 'Exportar a PDF'}
        </button>
        <button 
          className="btn btn-secondary flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
          onClick={() => handleExport('excel')}
          disabled={loading}
        >
          <FileSpreadsheet size={20} />
          {loading ? 'Generando...' : 'Exportar a Excel'}
        </button>
      </div>
    </div>
  );
};

export default Reportes;
