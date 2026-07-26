import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, X, Search, CheckCircle, Clock } from 'lucide-react';
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
  const [showModal, setShowModal] = useState(false);
  const [filterEstado, setFilterEstado] = useState<string>('');
  const { user } = useAuth();

  // Form states
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
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidentes();
  }, [filterEstado]);

  const handleSubmit = async (e: React.FormEvent) => {
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
      setShowModal(false);
      fetchIncidentes();
      // Reset form
      setTerminal('');
      setStockCalculado('');
      setStockFisico('');
      setComentarios('');
    } catch (error) {
      setFormError('Error al reportar el incidente');
    }
  };

  const handleChangeStatus = async (id: string, nuevoEstado: string) => {
    if (!window.confirm(`¿Seguro que deseas cambiar el estado a ${nuevoEstado}?`)) return;
    try {
      await updateIncidenteStatus(id, nuevoEstado);
      fetchIncidentes();
    } catch (error) {
      console.error(error);
      alert('Error al actualizar el estado');
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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle className="text-red-400" size={28} />
            Incidentes y Discrepancias
          </h1>
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Gestión de descuadres físicos vs lógicos</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          Reportar Discrepancia
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Search className="text-gray-400" size={20} />
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
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>Cargando...</td></tr>
            ) : incidentes.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>No hay incidentes reportados</td></tr>
            ) : (
              incidentes.map(incidente => (
                <tr key={incidente.id}>
                  <td style={{ fontFamily: 'monospace' }}>#{incidente.id.substring(0, 8)}</td>
                  <td>{format(new Date(incidente.fechaIncidente), 'dd/MM/yyyy HH:mm')}</td>
                  <td>{incidente.terminal}</td>
                  <td>{incidente.ingeniero?.nombre}</td>
                  <td>{incidente.stockCalculado}</td>
                  <td>{incidente.stockFisico}</td>
                  <td style={{ color: incidente.diferencia < 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                    {incidente.diferencia > 0 ? '+' : ''}{incidente.diferencia}
                  </td>
                  <td>{getStatusBadge(incidente.estado)}</td>
                  <td>
                    {(user?.rol === 'Admin' || user?.rol === 'Supervisor') && incidente.estado !== 'RESUELTO' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {incidente.estado === 'ABIERTO' && (
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                            onClick={() => handleChangeStatus(incidente.id, 'INVESTIGACION')}
                            title="Mover a Investigación"
                          >
                            <Clock size={16} />
                          </button>
                        )}
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', backgroundColor: '#10b981' }}
                          onClick={() => handleChangeStatus(incidente.id, 'RESUELTO')}
                          title="Marcar como Resuelto"
                        >
                          <CheckCircle size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Reportar Discrepancia</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X /></button>
            </div>
            
            {formError && <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.9rem' }}>{formError}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Terminal / Ubicación</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ej. Terminal 3 - Checkin A"
                  value={terminal}
                  onChange={e => setTerminal(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Stock según Sistema</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={stockCalculado}
                    onChange={e => setStockCalculado(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Stock Físico Real</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={stockFisico}
                    onChange={e => setStockFisico(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Comentarios / Motivo (Opcional)</label>
                <textarea 
                  className="input-field" 
                  rows={3} 
                  placeholder="Ej. Papel atascado y destruido en el rodillo..."
                  value={comentarios}
                  onChange={e => setComentarios(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar Incidente</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Incidentes;
