import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Plus, X, Search, CheckCircle, Clock, Eye, MessageSquare, Send, FileText, User, MapPin, Calendar, Layers } from 'lucide-react';
import { getIncidentes, createIncidente, updateIncidenteStatus } from '../services/incidentesService';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

interface Incidente {
  id: string;
  terminal: string;
  ingenieroId: string;
  ingeniero: { nombre: string };
  stockCalculado: number;
  stockFisico: number;
  diferencia: number;
  estado: string;
  fechaIncidente: string;
  comentarios: string;
}

const Incidentes: React.FC = () => {
  const [incidentes, setIncidentes] = useState<Incidente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterEstado, setFilterEstado] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { user } = useAuth();

  // Modales de Detalle y Cambio de Estado
  const [selectedIncidenteDetail, setSelectedIncidenteDetail] = useState<Incidente | null>(null);
  const [statusModalIncidente, setStatusModalIncidente] = useState<{ incidente: Incidente; targetStatus: string } | null>(null);
  const [notaEstado, setNotaEstado] = useState<string>('');
  const [nuevaNotaDetalle, setNuevaNotaDetalle] = useState<string>('');
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Form states para Crear Incidente
  const [terminal, setTerminal] = useState('');
  const [stockCalculado, setStockCalculado] = useState<number | ''>('');
  const [stockFisico, setStockFisico] = useState<number | ''>('');
  const [comentarios, setComentarios] = useState('');
  const [formError, setFormError] = useState('');

  const fetchIncidentes = async () => {
    try {
      setLoading(true);
      const data = await getIncidentes(filterEstado);
      setIncidentes(data);

      // Si hay un detalle abierto, actualizarlo con los datos frescos
      if (selectedIncidenteDetail) {
        const fresco = data.find((i: Incidente) => i.id === selectedIncidenteDetail.id);
        if (fresco) setSelectedIncidenteDetail(fresco);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidentes();
  }, [filterEstado]);

  const incidentesFiltrados = useMemo(() => {
    return incidentes.filter(inc => {
      const query = searchQuery.toLowerCase();
      const matchSearch = 
        inc.id.toLowerCase().includes(query) ||
        inc.terminal.toLowerCase().includes(query) ||
        (inc.ingeniero?.nombre || '').toLowerCase().includes(query) ||
        (inc.comentarios || '').toLowerCase().includes(query);
      return matchSearch;
    });
  }, [incidentes, searchQuery]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!terminal || stockCalculado === '' || stockFisico === '') {
      setFormError('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      await createIncidente({
        terminal,
        stockCalculado: Number(stockCalculado),
        stockFisico: Number(stockFisico),
        comentarios
      });
      setShowCreateModal(false);
      fetchIncidentes();
      setTerminal('');
      setStockCalculado('');
      setStockFisico('');
      setComentarios('');
    } catch (error) {
      setFormError('Error al reportar el incidente');
    }
  };

  const handleOpenStatusModal = (incidente: Incidente, targetStatus: string) => {
    setStatusModalIncidente({ incidente, targetStatus });
    setNotaEstado('');
  };

  const handleConfirmStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalIncidente) return;

    try {
      setSubmittingStatus(true);
      await updateIncidenteStatus(
        statusModalIncidente.incidente.id,
        statusModalIncidente.targetStatus,
        notaEstado
      );
      setStatusModalIncidente(null);
      setNotaEstado('');
      await fetchIncidentes();
    } catch (error) {
      console.error(error);
      alert('Error al actualizar el estado del incidente');
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleAddNotaDetalle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncidenteDetail || !nuevaNotaDetalle.trim()) return;

    try {
      setSubmittingStatus(true);
      await updateIncidenteStatus(
        selectedIncidenteDetail.id,
        selectedIncidenteDetail.estado,
        nuevaNotaDetalle
      );
      setNuevaNotaDetalle('');
      await fetchIncidentes();
    } catch (error) {
      console.error(error);
      alert('Error al agregar nota al ticket');
    } finally {
      setSubmittingStatus(false);
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'ABIERTO':
        return <span style={{ padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: '#fee2e2', color: '#ef4444' }}>Abierto</span>;
      case 'INVESTIGACION':
        return <span style={{ padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: '#fef3c7', color: '#f59e0b' }}>En Investigación</span>;
      case 'RESUELTO':
        return <span style={{ padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: '#dcfce7', color: '#10b981' }}>Resuelto</span>;
      default:
        return <span>{estado}</span>;
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle className="text-red-400" size={28} />
          Incidentes y Discrepancias
        </h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Gestión de descuadres físicos vs lógicos y seguimiento de tickets</p>
      </div>

      {/* Bar de Filtros y Búsqueda */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px', background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <Search className="text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Buscar por ticket #, terminal, ingeniero o comentario..."
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <select 
              className="input-field" 
              style={{ width: '200px', margin: 0 }}
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
            >
              <option value="">Todos los Estados</option>
              <option value="ABIERTO">Abiertos</option>
              <option value="INVESTIGACION">En Investigación</option>
              <option value="RESUELTO">Resueltos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Incidentes */}
      <div className="card p-0 overflow-hidden">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>ID Ticket</th>
              <th>Fecha</th>
              <th>Terminal</th>
              <th>Reportado por</th>
              <th>Sistema</th>
              <th>Físico</th>
              <th>Diferencia</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>Cargando incidentes...</td></tr>
            ) : incidentesFiltrados.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>No se encontraron incidentes para el filtro seleccionado.</td></tr>
            ) : (
              incidentesFiltrados.map(incidente => (
                <tr key={incidente.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>#{incidente.id.substring(0, 8)}</td>
                  <td>{format(new Date(incidente.fechaIncidente), 'dd/MM/yyyy HH:mm')}</td>
                  <td>{incidente.terminal}</td>
                  <td>{incidente.ingeniero?.nombre || 'Usuario'}</td>
                  <td>{incidente.stockCalculado} rollos</td>
                  <td>{incidente.stockFisico} rollos</td>
                  <td style={{ color: incidente.diferencia < 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                    {incidente.diferencia > 0 ? '+' : ''}{incidente.diferencia}
                  </td>
                  <td>{getStatusBadge(incidente.estado)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      {/* Botón Ver Detalle */}
                      <button 
                        className="btn" 
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                        onClick={() => setSelectedIncidenteDetail(incidente)}
                        title="Ver Detalle y Bitácora del Ticket"
                      >
                        <Eye size={16} />
                        Detalle
                      </button>

                      {/* Acciones de cambio de estado */}
                      {(user?.rol === 'Admin' || user?.rol === 'Supervisor') && incidente.estado !== 'RESUELTO' && (
                        <>
                          {incidente.estado === 'ABIERTO' && (
                            <button 
                              className="btn" 
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: '#f59e0b', color: 'white' }}
                              onClick={() => handleOpenStatusModal(incidente, 'INVESTIGACION')}
                              title="Mover a Investigación con Nota"
                            >
                              <Clock size={16} />
                            </button>
                          )}
                          <button 
                            className="btn" 
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: '#10b981', color: 'white' }}
                            onClick={() => handleOpenStatusModal(incidente, 'RESUELTO')}
                            title="Resolver Ticket con Explicación"
                          >
                            <CheckCircle size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: DETALLE Y BITÁCORA DE SEGUIMIENTO DEL TICKET */}
      {selectedIncidenteDetail && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0', pb: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h2 style={{ margin: 0, fontFamily: 'monospace', color: 'var(--color-primary-dark)' }}>
                    Ticket #{selectedIncidenteDetail.id.substring(0, 8)}
                  </h2>
                  {getStatusBadge(selectedIncidenteDetail.estado)}
                </div>
                <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                  Reportado el {format(new Date(selectedIncidenteDetail.fechaIncidente), 'dd/MM/yyyy HH:mm')} hrs
                </p>
              </div>
              <button className="btn-icon" onClick={() => setSelectedIncidenteDetail(null)}><X /></button>
            </div>

            <div style={{ padding: '1rem 0' }}>
              {/* Tarjetas de Información Clave */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.8rem', mb: '0.2rem' }}>
                    <MapPin size={14} /> Ubicación / Terminal
                  </div>
                  <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>{selectedIncidenteDetail.terminal}</strong>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.8rem', mb: '0.2rem' }}>
                    <User size={14} /> Reportado por
                  </div>
                  <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>{selectedIncidenteDetail.ingeniero?.nombre || 'Usuario'}</strong>
                </div>
              </div>

              {/* Desglose de Insumos & Discrepancia */}
              <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Layers size={18} /> Balance de Insumos Afectados
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', textAlign: 'center' }}>
                  <div style={{ background: 'white', padding: '0.5rem', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Stock Sistema</div>
                    <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{selectedIncidenteDetail.stockCalculado} rollos</strong>
                  </div>
                  <div style={{ background: 'white', padding: '0.5rem', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Stock Físico Real</div>
                    <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{selectedIncidenteDetail.stockFisico} rollos</strong>
                  </div>
                  <div style={{ background: 'white', padding: '0.5rem', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Discrepancia</div>
                    <strong style={{ fontSize: '1.1rem', color: selectedIncidenteDetail.diferencia < 0 ? '#ef4444' : '#10b981' }}>
                      {selectedIncidenteDetail.diferencia > 0 ? '+' : ''}{selectedIncidenteDetail.diferencia} rollos
                    </strong>
                  </div>
                </div>
              </div>

              {/* Historial / Bitácora de Comentarios */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MessageSquare size={18} /> Bitácora de Seguimiento e Historial
                </h4>
                <div style={{ background: '#fafafa', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '1rem', maxHeight: '200px', overflowY: 'auto' }}>
                  {selectedIncidenteDetail.comentarios ? (
                    <pre style={{ fontFamily: 'inherit', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.9rem', color: '#334155' }}>
                      {selectedIncidenteDetail.comentarios}
                    </pre>
                  ) : (
                    <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem' }}>Sin comentarios o notas registradas aún.</div>
                  )}
                </div>
              </div>

              {/* Agregar Nota de Avance */}
              <form onSubmit={handleAddNotaDetalle} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>
                  Agregar Nota de Seguimiento al Ticket
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Escribe un comentario de avance o revisión..."
                    style={{ flex: 1, margin: 0 }}
                    value={nuevaNotaDetalle}
                    onChange={(e) => setNuevaNotaDetalle(e.target.value)}
                  />
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    disabled={submittingStatus || !nuevaNotaDetalle.trim()}
                  >
                    <Send size={16} />
                    Agregar
                  </button>
                </div>
              </form>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedIncidenteDetail(null)}>Cerrar Ficha</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CAMBIO DE ESTADO Y JUSTIFICACIÓN / RESOLUCIÓN */}
      {statusModalIncidente && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2>
                {statusModalIncidente.targetStatus === 'RESUELTO' ? '🟢 Resolver Incidente' : '🟡 Mover a Investigación'}
              </h2>
              <button className="btn-icon" onClick={() => setStatusModalIncidente(null)}><X /></button>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1.25rem', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Ticket #{statusModalIncidente.incidente.id.substring(0, 8)} - {statusModalIncidente.incidente.terminal}</div>
              <strong style={{ color: statusModalIncidente.incidente.diferencia < 0 ? '#ef4444' : '#10b981' }}>
                Discrepancia: {statusModalIncidente.incidente.diferencia > 0 ? '+' : ''}{statusModalIncidente.incidente.diferencia} rollos
              </strong>
            </div>

            <form onSubmit={handleConfirmStatusChange}>
              <div className="form-group">
                <label style={{ fontWeight: 'bold' }}>
                  {statusModalIncidente.targetStatus === 'RESUELTO' 
                    ? 'Explicación de Resolución / Causa Raíz (Requerido):' 
                    : 'Notas de Inicio de Investigación (Requerido):'}
                </label>
                <textarea 
                  className="input-field" 
                  rows={4} 
                  placeholder={
                    statusModalIncidente.targetStatus === 'RESUELTO'
                      ? "Ej. Se confirmó merma de 12 rollos por daño de humedad en almacén. Se ajustó el stock físico y se cierra ticket."
                      : "Ej. Se inicia revisión con el supervisor de turno de la Terminal 3."
                  }
                  value={notaEstado}
                  onChange={(e) => setNotaEstado(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setStatusModalIncidente(null)} disabled={submittingStatus}>
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ background: statusModalIncidente.targetStatus === 'RESUELTO' ? '#10b981' : '#f59e0b', color: 'white' }}
                  disabled={submittingStatus || !notaEstado.trim()}
                >
                  {submittingStatus ? 'Guardando...' : statusModalIncidente.targetStatus === 'RESUELTO' ? 'Confirmar y Resolver' : 'Guardar y Pasar a Investigación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Incidentes;
