import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, MapPin, X, Package } from 'lucide-react';

interface Almacen {
  id: string;
  nombre: string;
  ubicacion: string;
  capacidad: string;
  proveedor?: string;
  stockATB?: number;
  stockBTP?: number;
  estadoVisual?: 'VERDE' | 'AMBAR' | 'ROJO';
  diasCobertura?: number;
  sugerencia?: string;
}

const Almacenes: React.FC = () => {
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlmacen, setSelectedAlmacen] = useState<Almacen | null>(null);
  const [stockDetalle, setStockDetalle] = useState<any[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchAlmacenes = async () => {
      try {
        const response = await axios.get(((import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000'))) + '/api/almacenes');
        if (response.data.success) {
          setAlmacenes(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching almacenes', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAlmacenes();
  }, []);

  const handleVerStock = async (almacen: Almacen) => {
    setSelectedAlmacen(almacen);
    setModalOpen(true);
    setLoadingStock(true);
    try {
      const response = await axios.get(((import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000'))) + `/api/almacenes/${almacen.id}/stock`);
      if (response.data.success) {
        setStockDetalle(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stock detalle', error);
    } finally {
      setLoadingStock(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Gestión de Almacenes</h2>
        <button className="btn btn-primary">
          <Plus size={18} />
          Nuevo Almacén
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {loading ? (
          <div>Cargando...</div>
        ) : almacenes.length === 0 ? (
          <div className="card w-full">No hay almacenes registrados.</div>
        ) : (
          almacenes.map(almacen => (
            <div key={almacen.id} className="card relative" style={{ display: 'flex', flexDirection: 'column', height: '100%', borderTop: almacen.proveedor === 'SITA' ? '3px solid #3b82f6' : (almacen.proveedor === 'ASUR' ? '3px solid #10b981' : '3px solid var(--color-primary)') }}>
              {almacen.proveedor && (
                <div className={`absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded ${almacen.proveedor === 'SITA' ? 'bg-blue-900/50 text-blue-400 border border-blue-700/50' : (almacen.proveedor === 'ASUR' ? 'bg-green-900/50 text-green-400 border border-green-700/50' : 'bg-gray-800/50 text-gray-300 border border-gray-600/50')}`}>
                  {almacen.proveedor}
                </div>
              )}
              <h3 style={{ margin: '0 0 0.5rem 0', paddingRight: '4rem' }}>{almacen.nombre}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                <MapPin size={16} />
                {almacen.ubicacion}
              </div>

              {/* Status Visual y Cobertura */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', background: '#f8fafc', borderLeft: almacen.estadoVisual === 'ROJO' ? '4px solid var(--color-danger)' : almacen.estadoVisual === 'AMBAR' ? '4px solid var(--color-warning)' : '4px solid var(--color-success)' }}>
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>ESTADO OPERATIVO</p>
                  <strong style={{ color: almacen.estadoVisual === 'ROJO' ? 'var(--color-danger)' : almacen.estadoVisual === 'AMBAR' ? 'var(--color-warning)' : 'var(--color-success)' }}>
                    {almacen.estadoVisual || 'VERDE'}
                  </strong>
                </div>
                <div style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', background: '#f8fafc', borderLeft: '4px solid var(--color-primary)' }}>
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>COBERTURA ESTIMADA</p>
                  <strong>{almacen.diasCobertura ?? '--'} días</strong>
                </div>
              </div>

              {/* Stocks Actuales */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ background: '#e0e7ff', color: 'var(--color-primary)', padding: '0.25rem 0.75rem', borderRadius: '16px', fontSize: '0.875rem', fontWeight: 500 }}>
                  ATB: {almacen.stockATB || 0}
                </div>
                <div style={{ background: '#fef3c7', color: 'var(--color-warning)', padding: '0.25rem 0.75rem', borderRadius: '16px', fontSize: '0.875rem', fontWeight: 500 }}>
                  BTP: {almacen.stockBTP || 0}
                </div>
              </div>

              {/* Sugerencias de Reabastecimiento */}
              {almacen.sugerencia && (
                <div style={{ background: '#fee2e2', border: '1px dashed var(--color-danger)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  <strong style={{ color: 'var(--color-danger)', display: 'block', marginBottom: '0.25rem' }}>Sugerencia IA:</strong>
                  {almacen.sugerencia}
                  <button className="btn btn-primary" style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: '100%', background: 'var(--color-danger)' }}>
                    Aprobar Transferencia
                  </button>
                </div>
              )}

              <div style={{ marginTop: 'auto' }}>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem' }}><strong>Capacidad:</strong> {almacen.capacidad || 'N/A'}</p>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', background: 'var(--color-secondary)' }}
                  onClick={() => handleVerStock(almacen)}
                >
                  Ver Stock a Detalle
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Stock a Detalle */}
      {modalOpen && selectedAlmacen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={20} style={{ color: 'var(--color-primary)' }} />
                Stock a Detalle: {selectedAlmacen.nombre}
              </h3>
              <button className="btn-icon" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '1rem 0' }}>
              {loadingStock ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                  Cargando detalle de stock...
                </div>
              ) : stockDetalle.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                  No hay lotes con stock en este almacén.
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Lote</th>
                        <th>Cantidad</th>
                        <th>Cajas</th>
                        <th>Tipo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockDetalle.map((stockItem) => {
                        const esATB = stockItem.tipoPapel?.codigo?.includes('ATB');
                        const cajas = Math.floor(stockItem.cantidadActual / (stockItem.tipoPapel?.cantidadPorCaja || 1));
                        const rollosSueltos = stockItem.cantidadActual % (stockItem.tipoPapel?.cantidadPorCaja || 1);
                        return (
                          <tr key={stockItem.id}>
                            <td style={{ fontWeight: 500, color: esATB ? 'var(--color-primary)' : 'var(--color-warning)' }}>
                              {stockItem.tipoPapel?.codigo || 'N/A'}
                            </td>
                            <td>{stockItem.lote || 'Sin Lote'}</td>
                            <td style={{ fontWeight: 'bold' }}>{stockItem.cantidadActual}</td>
                            <td>
                              {cajas > 0 ? `${cajas} caja(s)` : ''} {rollosSueltos > 0 ? `+ ${rollosSueltos} rollo(s)` : ''}
                            </td>
                            <td>
                              <span style={{ 
                                padding: '0.25rem 0.5rem', 
                                borderRadius: '12px', 
                                fontSize: '0.75rem', 
                                fontWeight: 600,
                                background: esATB ? '#e0e7ff' : '#fef3c7',
                                color: esATB ? 'var(--color-primary)' : 'var(--color-warning)'
                              }}>
                                {esATB ? 'ATB' : 'BTP'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn" onClick={() => setModalOpen(false)} style={{ background: '#e2e8f0', color: 'var(--color-text)' }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Almacenes;
