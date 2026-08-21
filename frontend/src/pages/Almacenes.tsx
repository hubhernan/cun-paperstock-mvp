import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { 
  Plus, 
  MapPin, 
  X, 
  Package, 
  Check, 
  AlertCircle, 
  Edit3, 
  CheckCircle2,
  ArrowRightLeft, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  AlertTriangle,
  History
} from 'lucide-react';
import { format } from 'date-fns';

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

interface Movimiento {
  id: string;
  tipoMovimiento: string;
  cantidad: number;
  fechaMovimiento: string;
  comentarios: string;
  tipoPapel: { codigo: string; descripcion: string };
  almacenOrigen: { nombre: string; proveedor?: string } | null;
  almacenDestino: { nombre: string; proveedor?: string } | null;
  usuario: { nombre: string };
}

const Almacenes: React.FC = () => {
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlmacen, setSelectedAlmacen] = useState<Almacen | null>(null);
  const [stockDetalle, setStockDetalle] = useState<any[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Movimientos Informativos (Réplica en Almacenes)
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loadingMovimientos, setLoadingMovimientos] = useState(true);
  const [filtroTipoMovimiento, setFiltroTipoMovimiento] = useState<string>('ALL');

  // Estados para verificación de stock y discrepancias
  const [verificandoId, setVerificandoId] = useState<string | null>(null);
  const [editandoStockId, setEditandoStockId] = useState<string | null>(null);
  const [conteoFisico, setConteoFisico] = useState<number>(0);
  const [comentarioDiscrepancia, setComentarioDiscrepancia] = useState<string>('');
  const [verificacionState, setVerificacionState] = useState<Record<string, 'OK' | 'DISCREPANCIA'>>({});
  const [feedbackMsg, setFeedbackMsg] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

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

  const fetchMovimientos = async () => {
    try {
      setLoadingMovimientos(true);
      const response = await axios.get(((import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000'))) + '/api/movimientos');
      if (response.data.success) {
        setMovimientos(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching movimientos en Almacenes', error);
    } finally {
      setLoadingMovimientos(false);
    }
  };

  useEffect(() => {
    fetchAlmacenes();
    fetchMovimientos();
  }, []);

  const handleVerStock = async (almacen: Almacen) => {
    setSelectedAlmacen(almacen);
    setModalOpen(true);
    setLoadingStock(true);
    setFeedbackMsg(null);
    setEditandoStockId(null);
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

  const handleConfirmarOK = async (stockItem: any) => {
    if (!selectedAlmacen) return;
    setVerificandoId(stockItem.id);
    setFeedbackMsg(null);
    try {
      const response = await axios.post(
        ((import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000'))) + '/api/almacenes/verificar-stock',
        {
          almacenId: selectedAlmacen.id,
          tipoPapelId: stockItem.tipoPapelId,
          stockCalculado: stockItem.cantidadActual,
          stockFisico: stockItem.cantidadActual
        }
      );
      if (response.data.success) {
        setVerificacionState(prev => ({ ...prev, [stockItem.id]: 'OK' }));
        setFeedbackMsg({ tipo: 'success', texto: response.data.message });
        fetchMovimientos();
      }
    } catch (err: any) {
      setFeedbackMsg({ tipo: 'error', texto: err.response?.data?.message || 'Error al confirmar stock' });
    } finally {
      setVerificandoId(null);
    }
  };

  const handleIniciarAjuste = (stockItem: any) => {
    setEditandoStockId(stockItem.id);
    setConteoFisico(stockItem.cantidadActual);
    setComentarioDiscrepancia('');
    setFeedbackMsg(null);
  };

  const handleGuardarDiscrepancia = async (stockItem: any) => {
    if (!selectedAlmacen) return;
    setVerificandoId(stockItem.id);
    setFeedbackMsg(null);
    try {
      const response = await axios.post(
        ((import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000'))) + '/api/almacenes/verificar-stock',
        {
          almacenId: selectedAlmacen.id,
          tipoPapelId: stockItem.tipoPapelId,
          stockCalculado: stockItem.cantidadActual,
          stockFisico: conteoFisico,
          comentarios: comentarioDiscrepancia
        }
      );
      if (response.data.success) {
        setVerificacionState(prev => ({ ...prev, [stockItem.id]: 'DISCREPANCIA' }));
        setFeedbackMsg({ tipo: 'success', texto: response.data.message });
        setEditandoStockId(null);
        handleVerStock(selectedAlmacen);
        fetchAlmacenes();
        fetchMovimientos();
      }
    } catch (err: any) {
      setFeedbackMsg({ tipo: 'error', texto: err.response?.data?.message || 'Error al registrar discrepancia' });
    } finally {
      setVerificandoId(null);
    }
  };

  // Helper functions para el formateo de movimientos
  const getMovIcon = (tipo: string) => {
    switch (tipo) {
      case 'ENTRADA': return <ArrowDownToLine size={18} color="var(--color-success)" />;
      case 'SALIDA': return <ArrowUpFromLine size={18} color="var(--color-warning)" />;
      case 'MERMA': return <AlertTriangle size={18} color="var(--color-danger)" />;
      case 'TRANSFERENCIA': return <ArrowRightLeft size={18} color="var(--color-primary-light)" />;
      default: return null;
    }
  };

  const formatOrigen = (mov: Movimiento) => {
    if (mov.tipoMovimiento === 'ENTRADA') return '-';
    if (!mov.almacenOrigen) return '-';
    return mov.almacenOrigen.nombre;
  };

  const formatDestino = (mov: Movimiento) => {
    if (mov.tipoMovimiento === 'MERMA') return '-';
    if (mov.tipoMovimiento === 'SALIDA') {
      if (mov.almacenDestino?.nombre) return mov.almacenDestino.nombre;
      if (mov.comentarios) {
        const match = mov.comentarios.match(/CUN\d[A-Z0-9]{5,}/i) || mov.comentarios.match(/Kiosko\s+([A-Z0-9_-]+)/i);
        if (match) {
          return match[0].startsWith('Kiosko') ? match[0] : `Kiosko ${match[0]}`;
        }
        if (mov.comentarios !== 'Registro manual') return mov.comentarios;
      }
      return 'Kiosko en Sitio';
    }
    return mov.almacenDestino?.nombre || '-';
  };

  const ultimos15Movimientos = useMemo(() => {
    const filtrados = movimientos.filter(mov => {
      if (filtroTipoMovimiento === 'ALL') return true;
      return mov.tipoMovimiento === filtroTipoMovimiento;
    });
    return filtrados.slice(0, 15);
  }, [movimientos, filtroTipoMovimiento]);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Gestión de Almacenes</h2>
        <button className="btn btn-primary">
          <Plus size={18} />
          Nuevo Almacén
        </button>
      </div>

      {/* Grid de Tarjetas de Almacenes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {loading ? (
          <div>Cargando almacenes...</div>
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

      {/* SECCIÓN INFERIOR: Réplica Informativa de los Últimos 15 Movimientos de Inventario */}
      <div className="card table-container" style={{ marginTop: '2.5rem', padding: 0 }}>
        <div style={{ 
          padding: '1rem 1.25rem', 
          borderBottom: '1px solid var(--color-border)', 
          display: 'flex', 
          justify: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '1rem',
          background: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={20} color="var(--color-primary)" />
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#1e293b' }}>
              Últimos 15 Movimientos de Inventario (Monitoreo en Tiempo Real)
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <select 
              className="input-field" 
              style={{ margin: 0, padding: '0.4rem 2rem 0.4rem 0.75rem', background: 'white', fontSize: '0.875rem' }} 
              value={filtroTipoMovimiento} 
              onChange={(e) => setFiltroTipoMovimiento(e.target.value)}
            >
              <option value="ALL">Todos los Movimientos</option>
              <option value="ENTRADA">Entrada</option>
              <option value="SALIDA">Salida</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="MERMA">Merma</option>
            </select>
          </div>
        </div>

        {loadingMovimientos ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Cargando últimos movimientos...
          </div>
        ) : ultimos15Movimientos.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            No hay movimientos registrados para el filtro seleccionado.
          </div>
        ) : (
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>TIPO</th>
                <th>PAPEL</th>
                <th>PROVEEDOR</th>
                <th>ORIGEN</th>
                <th>DESTINO</th>
                <th>CANTIDAD</th>
                <th>FECHA Y HORA</th>
                <th>USUARIO</th>
              </tr>
            </thead>
            <tbody>
              {ultimos15Movimientos.map((mov) => {
                const provOrigen = mov.almacenOrigen?.proveedor;
                const provDestino = mov.almacenDestino?.proveedor;
                const provRelevante = mov.tipoMovimiento === 'ENTRADA' ? provDestino : provOrigen;
                return (
                  <tr key={mov.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                        {getMovIcon(mov.tipoMovimiento)}
                        {mov.tipoMovimiento}
                      </div>
                    </td>
                    <td>{mov.tipoPapel.codigo}</td>
                    <td>
                      {provRelevante ? (
                        <span className={`text-xs font-bold px-2 py-1 rounded ${provRelevante === 'SITA' ? 'bg-blue-900/50 text-blue-400 border border-blue-700/50' : (provRelevante === 'ASUR' ? 'bg-green-900/50 text-green-400 border border-green-700/50' : 'bg-gray-800/50 text-gray-300 border border-gray-600/50')}`}>
                          {provRelevante}
                        </span>
                      ) : '-'}
                    </td>
                    <td style={{ fontWeight: 500 }}>{formatOrigen(mov)}</td>
                    <td style={{ fontWeight: 500 }}>{formatDestino(mov)}</td>
                    <td style={{ fontWeight: 600 }}>{mov.cantidad}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{format(new Date(mov.fechaMovimiento), 'dd/MM/yyyy HH:mm')}</td>
                    <td>{mov.usuario.nombre}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Stock a Detalle */}
      {modalOpen && selectedAlmacen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '850px' }}>
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
              {feedbackMsg && (
                <div style={{ 
                  padding: '0.75rem 1rem', 
                  borderRadius: '6px', 
                  marginBottom: '1rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  background: feedbackMsg.tipo === 'success' ? '#d1fae5' : '#fee2e2',
                  color: feedbackMsg.tipo === 'success' ? '#047857' : '#b91c1c'
                }}>
                  {feedbackMsg.tipo === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  {feedbackMsg.texto}
                </div>
              )}

              {loadingStock ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                  Cargando detalle de stock...
                </div>
              ) : stockDetalle.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                  No hay stock en este almacén.
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Cantidad Sistema</th>
                        <th>Rollos</th>
                        <th>Tipo</th>
                        <th>Verificación en Sitio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockDetalle.map((stockItem) => {
                        const esATB = stockItem.tipoPapel?.codigo?.includes('ATB');
                        const esCorrecto = verificacionState[stockItem.id] === 'OK';
                        const esEditando = editandoStockId === stockItem.id;
                        return (
                          <React.Fragment key={stockItem.id}>
                            <tr>
                              <td style={{ fontWeight: 500, color: esATB ? 'var(--color-primary)' : 'var(--color-warning)' }}>
                                {stockItem.tipoPapel?.codigo || 'N/A'}
                              </td>
                              <td style={{ fontWeight: 'bold' }}>{stockItem.cantidadActual}</td>
                              <td>
                                {stockItem.cantidadActual} rollo(s)
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
                              <td>
                                {esCorrecto ? (
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-success)', fontWeight: 600, fontSize: '0.85rem' }}>
                                    <CheckCircle2 size={16} /> Verificado OK
                                  </span>
                                ) : (
                                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button 
                                      className="btn btn-primary"
                                      style={{ background: 'var(--color-success)', padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                                      onClick={() => handleConfirmarOK(stockItem)}
                                      disabled={verificandoId === stockItem.id}
                                    >
                                      <Check size={14} /> OK (Correcto)
                                    </button>
                                    <button 
                                      className="btn btn-primary"
                                      style={{ background: 'var(--color-warning)', padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                                      onClick={() => handleIniciarAjuste(stockItem)}
                                      disabled={verificandoId === stockItem.id}
                                    >
                                      <Edit3 size={14} /> Discrepancia
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>

                            {/* Sub-formulario inline para reporte de discrepancia */}
                            {esEditando && (
                              <tr>
                                <td colSpan={5} style={{ background: '#fff7ed', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ffedd5' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <strong style={{ fontSize: '0.85rem', color: '#c2410c' }}>
                                      Reportar Discrepancia Física: {stockItem.tipoPapel?.codigo}
                                    </strong>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                      <div style={{ flex: 1, minWidth: '140px' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#9a3412', marginBottom: '0.25rem' }}>Conteo Físico Real (Rollos)</label>
                                        <input 
                                          type="number" 
                                          min="0"
                                          className="input-field"
                                          style={{ width: '100%', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                                          value={conteoFisico} 
                                          onChange={e => setConteoFisico(Number(e.target.value))} 
                                        />
                                      </div>
                                      <div style={{ flex: 2, minWidth: '200px' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#9a3412', marginBottom: '0.25rem' }}>Motivo / Observación (Opcional)</label>
                                        <input 
                                          type="text" 
                                          placeholder="Ej. Faltan 10 rollos no contabilizados en sistema"
                                          className="input-field"
                                          style={{ width: '100%', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                                          value={comentarioDiscrepancia} 
                                          onChange={e => setComentarioDiscrepancia(e.target.value)} 
                                        />
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                                      <button 
                                        className="btn" 
                                        style={{ background: '#e2e8f0', color: '#475569', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                        onClick={() => setEditandoStockId(null)}
                                      >
                                        Cancelar
                                      </button>
                                      <button 
                                        className="btn btn-primary" 
                                        style={{ background: 'var(--color-danger)', padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                                        onClick={() => handleGuardarDiscrepancia(stockItem)}
                                        disabled={verificandoId === stockItem.id}
                                      >
                                        <AlertCircle size={14} /> Registrar Incidente y Ajustar
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
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
