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
  History,
  Layers,
  Clock,
  Info
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

interface CorteDiarioItem {
  id: string;
  fechaCorte: string;
  totalStock: number;
  totalAtb: number;
  totalBtp: number;
  creadoPor?: string;
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

interface VerificacionOK {
  id: string;
  fecha: string;
  fechaFormatted: string;
  horaFormatted: string;
  descripcion: string;
  papel: string;
  cantidad: number;
  usuario: string;
  almacenNombre: string;
}

const Almacenes: React.FC = () => {
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [cortesDiarios, setCortesDiarios] = useState<CorteDiarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlmacen, setSelectedAlmacen] = useState<Almacen | null>(null);
  const [stockDetalle, setStockDetalle] = useState<any[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Movimientos Informativos (Réplica en Almacenes)
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loadingMovimientos, setLoadingMovimientos] = useState(true);
  const [filtroTipoMovimiento, setFiltroTipoMovimiento] = useState<string>('ALL');

  // Bitácora de Verificaciones Stock OK
  const [verificacionesOK, setVerificacionesOK] = useState<VerificacionOK[]>([]);
  const [loadingVerificaciones, setLoadingVerificaciones] = useState<boolean>(true);
  const [filtroTerminalVerif, setFiltroTerminalVerif] = useState<string>('ALL');

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

  const fetchCortesDiarios = async () => {
    try {
      const response = await axios.get(((import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000'))) + '/api/cortes-diarios/ultimos3');
      if (response.data.success) {
        setCortesDiarios(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching cortes diarios', error);
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

  const fetchVerificacionesOK = async () => {
    try {
      setLoadingVerificaciones(true);
      const response = await axios.get(((import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000'))) + '/api/almacenes/verificaciones-ok');
      if (response.data.success) {
        setVerificacionesOK(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching verificaciones OK', error);
    } finally {
      setLoadingVerificaciones(false);
    }
  };

  useEffect(() => {
    fetchAlmacenes();
    fetchCortesDiarios();
    fetchMovimientos();
    fetchVerificacionesOK();
  }, []);

  const handleVerStock = async (almacen: Almacen) => {
    setSelectedAlmacen(almacen);
    setModalOpen(true);
    setLoadingStock(true);
    setFeedbackMsg(null);
    setEditandoStockId(null);
    fetchVerificacionesOK();
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
        fetchVerificacionesOK();
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

      {/* Seccion Principal: Almacenes a la Izquierda y Cortes Diarios a la Derecha */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Lado Izquierdo: Tarjetas de los 3 Almacenes */}
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={20} color="var(--color-primary)" />
            Bodegas de Almacenamiento
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
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
        </div>

        {/* Lado Derecho: Tarjetas Informativas Compactas de Cortes Diarios a las 23:50 hrs */}
        <div style={{ maxWidth: '380px', width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={20} color="#10b981" />
            Cortes Diarios (23:50 hrs)
          </h3>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
            Foto de stock total tomada al cierre del día (23:50 hrs).
          </p>

          {cortesDiarios.length === 0 ? (
            <div className="card">Sin datos de corte diario.</div>
          ) : (
            cortesDiarios.map((corte, idx) => {
              const fechaFormatted = format(new Date(corte.fechaCorte), 'dd/MM/yyyy');
              return (
                <div 
                  key={corte.id || idx} 
                  className="card" 
                  style={{ 
                    padding: '1rem 1.15rem', 
                    borderRadius: '14px', 
                    background: '#ffffff', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)', 
                    position: 'relative',
                    marginBottom: 0
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    {/* Contenedor Verde Esmeralda Suave con Icono de Capas */}
                    <div style={{ 
                      width: '42px', 
                      height: '42px', 
                      borderRadius: '10px', 
                      background: '#ecfdf5', 
                      border: '1px solid #a7f3d0',
                      display: 'flex', 
                      alignItems: 'center', 
                      justify: 'center', 
                      flexShrink: 0 
                    }}>
                      <Layers size={22} color="#10b981" />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Stock Total (Uds)</span>
                        <span style={{ fontSize: '0.725rem', background: '#f1f5f9', color: '#334155', padding: '0.15rem 0.45rem', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={11} color="#64748b" />
                          {fechaFormatted} - 23:50 hrs
                        </span>
                      </div>
                      
                      {/* Gran Total Destacado */}
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, marginBottom: '0.5rem' }}>
                        {corte.totalStock}
                      </div>

                      {/* Chips Azul (ATB) y Amarillo Ligero (BTP) */}
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <div style={{ background: '#e0e7ff', color: 'var(--color-primary)', padding: '0.2rem 0.65rem', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 600 }}>
                          ATB: {corte.totalAtb}
                        </div>
                        <div style={{ background: '#fef3c7', color: 'var(--color-warning)', padding: '0.2rem 0.65rem', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 600 }}>
                          BTP: {corte.totalBtp}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
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

      {/* Bitácora General de Verificaciones de Stock OK (Firmas de Campo) */}
      <div className="card" style={{ marginTop: '1.5rem', padding: '1.25rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '1rem',
          gap: '1rem',
          background: '#f8fafc',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={20} color="#16a34a" />
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#1e293b' }}>
              Bitácora de Verificaciones de Stock OK (Firma y Conteo de Campo)
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <select 
              className="input-field" 
              style={{ margin: 0, padding: '0.4rem 2rem 0.4rem 0.75rem', background: 'white', fontSize: '0.875rem' }} 
              value={filtroTerminalVerif} 
              onChange={(e) => setFiltroTerminalVerif(e.target.value)}
            >
              <option value="ALL">Todas las Terminales</option>
              <option value="T2">Terminal 2</option>
              <option value="T3">Terminal 3</option>
              <option value="T4">Terminal 4</option>
            </select>
          </div>
        </div>

        {loadingVerificaciones ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Cargando bitácora de verificaciones OK...
          </div>
        ) : (
          (() => {
            const verifsFiltradas = verificacionesOK.filter(v => {
              if (filtroTerminalVerif === 'ALL') return true;
              if (filtroTerminalVerif === 'T2') return v.descripcion.includes('T2') || v.almacenNombre.includes('Terminal 2');
              if (filtroTerminalVerif === 'T3') return v.descripcion.includes('T3') || v.almacenNombre.includes('Terminal 3');
              if (filtroTerminalVerif === 'T4') return v.descripcion.includes('T4') || v.almacenNombre.includes('Terminal 4');
              return true;
            });

            if (verifsFiltradas.length === 0) {
              return (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No se encontraron verificaciones OK registradas para el filtro seleccionado.
                </div>
              );
            }

            return (
              <div className="table-responsive">
                <table className="data-table w-full" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>FECHA</th>
                      <th>HORA</th>
                      <th>DESCRIPCIÓN</th>
                      <th>PAPEL</th>
                      <th style={{ textAlign: 'center' }}>CANTIDAD</th>
                      <th>USUARIO / INGENIERO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verifsFiltradas.map((v) => (
                      <tr key={v.id}>
                        <td style={{ fontWeight: 500 }}>{v.fechaFormatted}</td>
                        <td style={{ color: '#475569' }}>{v.horaFormatted}</td>
                        <td>
                          <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem', fontWeight: 600 }}>
                            {v.descripcion}
                          </span>
                        </td>
                        <td>
                          <span className="badge" style={{ 
                            background: v.papel === 'ATB' ? '#dbeafe' : '#fef3c7', 
                            color: v.papel === 'ATB' ? '#1e40af' : '#b45309',
                            fontSize: '0.75rem',
                            fontWeight: 700 
                          }}>
                            {v.papel}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>
                          {v.cantidad}
                        </td>
                        <td style={{ fontWeight: 600, color: '#334155' }}>
                          {v.usuario}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()
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

                                    {/* Leyenda informativa de discrepancia sin alteración de stock */}
                                    <div style={{ 
                                      background: '#eff6ff', 
                                      border: '1px solid #93c5fd', 
                                      borderRadius: '6px', 
                                      padding: '0.5rem 0.75rem', 
                                      fontSize: '0.75rem', 
                                      color: '#1e40af', 
                                      display: 'flex', 
                                      alignItems: 'flex-start', 
                                      gap: '0.5rem' 
                                    }}>
                                      <Info size={16} style={{ minWidth: '16px', marginTop: '2px', color: '#2563eb' }} />
                                      <span>
                                        <strong>Aviso Informativo:</strong> El registro de esta discrepancia es meramente <strong>INFORMATIVO</strong> para la apertura de una investigación. El stock registrado en el sistema <strong>NO sufrirá alteraciones ni ajustes automáticos</strong> hasta que un supervisor investigue el origen del faltante o sobrante.
                                      </span>
                                    </div>

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
                                        style={{ background: '#2563eb', padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                                        onClick={() => handleGuardarDiscrepancia(stockItem)}
                                        disabled={verificandoId === stockItem.id}
                                      >
                                        📝 Registrar Discrepancia Informativa
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

              {/* Bitácora de Verificaciones de Stock OK firmadas para este Almacén */}
              <div style={{ marginTop: '1.5rem', borderTop: '1px dashed #cbd5e1', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <CheckCircle2 size={16} color="#16a34a" /> Bitácora de Verificaciones de Stock OK (Firma y Conteo)
                  </h4>
                  <span className="badge" style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.75rem', fontWeight: 600 }}>
                    {verificacionesOK.filter(v => v.almacenNombre === selectedAlmacen?.nombre).length} Registros
                  </span>
                </div>

                <div className="table-responsive" style={{ maxHeight: '200px', overflowY: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <table className="table w-full" style={{ fontSize: '0.78rem', marginBottom: 0 }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                      <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '0.5rem 0.75rem' }}>FECHA</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>HORA</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>DESCRIPCIÓN</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>PAPEL</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>CANT</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>USUARIO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {verificacionesOK.filter(v => v.almacenNombre === selectedAlmacen?.nombre).length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '1rem', color: '#64748b' }}>
                            No se han registrado verificaciones OK para este almacén.
                          </td>
                        </tr>
                      ) : (
                        verificacionesOK
                          .filter(v => v.almacenNombre === selectedAlmacen?.nombre)
                          .map((v) => (
                            <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '0.4rem 0.75rem', fontWeight: 500 }}>{v.fechaFormatted}</td>
                              <td style={{ padding: '0.4rem 0.75rem', color: '#475569' }}>{v.horaFormatted}</td>
                              <td>
                                <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.7rem', fontWeight: 600 }}>
                                  {v.descripcion}
                                </span>
                              </td>
                              <td>
                                <span className="badge" style={{ 
                                  background: v.papel === 'ATB' ? '#dbeafe' : '#fef3c7', 
                                  color: v.papel === 'ATB' ? '#1e40af' : '#b45309',
                                  fontSize: '0.7rem',
                                  fontWeight: 700 
                                }}>
                                  {v.papel}
                                </span>
                              </td>
                              <td style={{ padding: '0.4rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>
                                {v.cantidad}
                              </td>
                              <td style={{ padding: '0.4rem 0.75rem', fontWeight: 600, color: '#334155' }}>
                                {v.usuario}
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
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
