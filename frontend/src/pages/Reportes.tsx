import React, { useState, useEffect } from 'react';
import { FileText, FileSpreadsheet, Search, Eraser, Package } from 'lucide-react';
import { 
  getReporteMovimientos, 
  getReporteStockValor, 
  getReporteConsumoArea, 
  getReporteConsumoAlmacen,
  getReporteMovimientosIngeniero,
  getReporteKioskosAbastecidos,
  getReporteIncidentes
} from '../services/reportesService';
import { exportToExcel } from '../utils/exportUtils';
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

  // Report results state
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportColumns, setReportColumns] = useState<{header: string, dataKey: string}[]>([]);
  const [reportTitle, setReportTitle] = useState('');
  const [reportFileName, setReportFileName] = useState('');

  useEffect(() => {
    const fetchFiltros = async () => {
      try {
        const [resAreas, resAlmacenes] = await Promise.all([
          api.get('/areas'),
          api.get('/almacenes')
        ]);
        setAreas(resAreas.data.data || resAreas.data);
        setAlmacenes(resAlmacenes.data.data || resAlmacenes.data);
      } catch (err) {
        console.error('Error cargando filtros', err);
      }
    };
    fetchFiltros();
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setReportData([]);
    setReportColumns([]);
    
    try {
      let data = [];
      let columns: any[] = [];
      let title = '';
      let fileName = '';

      const filters: Record<string, string> = {
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
          almacenNombre: d.almacenOrigen ? `${d.almacenOrigen.nombre} - ${d.almacenOrigen.ubicacion}` : '',
          proveedor: d.almacenOrigen?.proveedor || '-',
          codigoPapel: d.tipoPapel?.codigo || '',
          cantidad: d.cantidad
        }));
      } else if (tipoReporte === 'movimientosIngeniero') {
        data = await getReporteMovimientosIngeniero(filters);
        title = 'Movimientos por Ingeniero';
        fileName = 'reporte_mov_ingeniero';
        columns = [
          { header: 'Fecha', dataKey: 'fechaFormat' },
          { header: 'Ingeniero', dataKey: 'usuarioNombre' },
          { header: 'Tipo', dataKey: 'tipoMovimiento' },
          { header: 'Papel', dataKey: 'codigoPapel' },
          { header: 'Cantidad', dataKey: 'cantidad' },
        ];
        data = data.map((d: any) => ({
          fechaFormat: format(new Date(d.fechaMovimiento), 'dd/MM/yyyy HH:mm'),
          usuarioNombre: d.usuario?.nombre || '',
          tipoMovimiento: d.tipoMovimiento,
          codigoPapel: d.tipoPapel?.codigo || '',
          cantidad: d.cantidad
        }));
      } else if (tipoReporte === 'kioskosAbastecidos') {
        data = await getReporteKioskosAbastecidos(filters);
        title = 'Kioskos Abastecidos (Intervenciones)';
        fileName = 'reporte_kioskos_abastecidos';
        columns = [
          { header: 'Fecha', dataKey: 'fechaFormat' },
          { header: 'Kiosko', dataKey: 'kiosko' },
          { header: 'Acción Realizada', dataKey: 'accion' },
          { header: 'Ingeniero', dataKey: 'usuarioNombre' },
        ];
        data = data.map((d: any) => ({
          fechaFormat: format(new Date(d.fecha), 'dd/MM/yyyy HH:mm'),
          kiosko: d.periferico?.identificadorUnico || '',
          accion: d.accion,
          usuarioNombre: d.ingeniero?.nombre || ''
        }));
      } else if (tipoReporte === 'incidentesNoAtendidos') {
        filters.estado = 'ABIERTO';
        data = await getReporteIncidentes(filters);
        title = 'Incidentes No Atendidos';
        fileName = 'reporte_incidentes_abiertos';
        columns = [
          { header: 'Fecha', dataKey: 'fechaFormat' },
          { header: 'Terminal', dataKey: 'terminal' },
          { header: 'Ingeniero', dataKey: 'ingenieroNombre' },
          { header: 'Diferencia', dataKey: 'diferencia' },
          { header: 'Comentarios', dataKey: 'comentarios' },
        ];
        data = data.map((d: any) => ({
          fechaFormat: format(new Date(d.fechaIncidente), 'dd/MM/yyyy HH:mm'),
          terminal: d.terminal,
          ingenieroNombre: d.ingeniero?.nombre || '',
          diferencia: d.diferencia,
          comentarios: d.comentarios || '-'
        }));
      }

      if (data.length === 0) {
        setError('No se encontraron registros para los filtros seleccionados.');
      } else {
        setReportData(data);
        setReportColumns(columns);
        setReportTitle(title);
        setReportFileName(fileName);
      }

    } catch (err) {
      console.error(err);
      setError('Ocurrió un error al generar el reporte.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (reportData.length > 0) {
      exportToExcel(reportData, reportTitle, reportFileName);
    }
  };

  const handleClear = () => {
    setReportData([]);
    setReportColumns([]);
    setError('');
  };

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ margin: 0 }}>
          <FileText className="text-blue-400" />
          Módulo de Reportes Avanzados
        </h1>
      </div>

      {error && <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div>
          <label className="form-label">Tipo de Reporte</label>
          <select 
            value={tipoReporte} 
            onChange={(e) => setTipoReporte(e.target.value)}
            className="form-input"
          >
            <option value="movimientos">Historial de Movimientos</option>
            <option value="valorStock">Valor de Stock Actual</option>
            <option value="consumoArea">Consumo por Área</option>
            <option value="consumoAlmacen">Consumo por Almacén</option>
            <option value="movimientosIngeniero">Movimientos por Ingeniero</option>
            <option value="kioskosAbastecidos">Kioskos Abastecidos</option>
            <option value="incidentesNoAtendidos">Incidentes No Atendidos</option>
          </select>
        </div>

        {tipoReporte !== 'valorStock' && (
          <>
            <div>
              <label className="form-label">Fecha Inicio</label>
              <input 
                type="date" 
                value={fechaInicio} 
                onChange={(e) => setFechaInicio(e.target.value)} 
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Fecha Fin</label>
              <input 
                type="date" 
                value={fechaFin} 
                onChange={(e) => setFechaFin(e.target.value)} 
                className="form-input"
              />
            </div>
          </>
        )}

        {tipoReporte === 'consumoArea' && (
          <div>
            <label className="form-label">Filtrar por Área</label>
            <select 
              value={areaId} 
              onChange={(e) => setAreaId(e.target.value)}
              className="form-input"
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
            <label className="form-label">Filtrar por Almacén</label>
            <select 
              value={almacenId} 
              onChange={(e) => setAlmacenId(e.target.value)}
              className="form-input"
            >
              <option value="">Todos los Almacenes</option>
              {almacenes.map(a => (
                <option key={a.id} value={a.id}>{a.nombre} - {a.ubicacion}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Cálculo de Gran Total ATB y BTP para Consumo por Área y Consumo por Almacén */}
      {(() => {
        const esReporteConsumo = tipoReporte === 'consumoArea' || tipoReporte === 'consumoAlmacen';

        const totalATB = esReporteConsumo ? reportData.reduce((acc, row) => {
          const cod = (row.codigoPapel || '').toUpperCase();
          return cod.includes('ATB') ? acc + (Number(row.cantidad) || 0) : acc;
        }, 0) : 0;

        const totalBTP = esReporteConsumo ? reportData.reduce((acc, row) => {
          const cod = (row.codigoPapel || '').toUpperCase();
          return cod.includes('BTP') ? acc + (Number(row.cantidad) || 0) : acc;
        }, 0) : 0;

        return (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                onClick={handleGenerate}
                disabled={loading}
              >
                <Search size={18} />
                {loading ? 'Generando...' : 'Generar Reporte'}
              </button>
              <button 
                className="btn"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#e2e8f0', color: '#334155' }}
                onClick={handleClear}
                disabled={loading || reportData.length === 0}
              >
                <Eraser size={18} />
                Limpiar
              </button>
            </div>

            {/* Tarjetas Informativas de Gran Total a la derecha */}
            {esReporteConsumo && reportData.length > 0 && (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  background: '#fef2f2', 
                  border: '1px solid #fca5a5', 
                  padding: '0.5rem 1rem', 
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                }}>
                  <div style={{ background: '#ef4444', color: 'white', padding: '0.45rem', borderRadius: '6px', display: 'flex' }}>
                    <Package size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#991b1b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total ATB Consumidos</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#7f1d1d' }}>{totalATB} <span style={{ fontSize: '0.8rem', fontWeight: '500', color: '#991b1b' }}>rollos</span></div>
                  </div>
                </div>

                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  background: '#fffbe6', 
                  border: '1px solid #fde68a', 
                  padding: '0.5rem 1rem', 
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                }}>
                  <div style={{ background: '#f59e0b', color: 'white', padding: '0.45rem', borderRadius: '6px', display: 'flex' }}>
                    <Package size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#92400e', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total BTP Consumidos</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#78350f' }}>{totalBTP} <span style={{ fontSize: '0.8rem', fontWeight: '500', color: '#92400e' }}>rollos</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {reportData.length > 0 && (
        <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: 'var(--color-primary-dark)' }}>Resultados: {reportTitle}</h3>
            <button 
              className="btn"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#10b981', color: 'white' }}
              onClick={handleExportExcel}
            >
              <FileSpreadsheet size={18} />
              Exportar a Excel
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {reportColumns.map((col, idx) => (
                    <th key={idx}>{col.header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, idx) => (
                  <tr key={idx}>
                    {reportColumns.map((col, cIdx) => (
                      <td key={cIdx}>{row[col.dataKey]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reportes;
