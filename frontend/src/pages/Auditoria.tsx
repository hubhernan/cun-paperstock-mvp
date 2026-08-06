import React, { useEffect, useState } from 'react';
import { Shield, Search, RefreshCw, Info } from 'lucide-react';
import api from '../services/api';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  usuarioId: string;
  usuario: {
    nombre: string;
    email: string;
  };
  accion: string;
  entidad: string;
  entidadId?: string;
  detalles?: string;
  ip?: string;
  fecha: string;
}

const Auditoria: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/auditoria');
      if (res.data.success) {
        setLogs(res.data.data);
      } else {
        setError('No se pudo cargar el registro de auditoría.');
      }
    } catch (err) {
      console.error(err);
      setError('Ocurrió un error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadgeClass = (accion: string) => {
    switch (accion) {
      case 'LOGIN':
        return 'badge-success';
      case 'LOGOUT':
        return 'badge-warning';
      case 'REGISTRO_INTERVENCION':
        return 'badge-primary';
      case 'REGISTRO_MOVIMIENTO':
        return 'badge-primary';
      default:
        return 'badge-secondary';
    }
  };

  const filteredLogs = logs.filter(log => 
    log.usuario?.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    log.accion.toLowerCase().includes(busqueda.toLowerCase()) ||
    (log.detalles || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield className="text-blue-600" />
            Bitácora de Auditoría y Seguridad
          </h2>
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
            Historial detallado de accesos y actividades registradas por ingenieros de campo.
          </p>
        </div>
        
        <button 
          className="btn btn-secondary" 
          onClick={fetchLogs}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refrescar Bitácora
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 'var(--border-radius)', padding: '0.5rem 1rem', width: '320px', gap: '0.5rem' }}>
          <Search size={18} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Filtrar por ingeniero o acción..." 
            style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem', color: 'var(--color-text)' }}
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {/* Listado de Logs */}
      <div className="card table-container" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Cargando bitácora de actividad...</div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            No se encontraron registros de auditoría.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Ingeniero</th>
                <th>Acción</th>
                <th>IP de Conexión</th>
                <th>Detalles de la Actividad</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                    {format(new Date(log.fecha), 'dd/MM/yyyy HH:mm:ss')}
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{log.usuario?.nombre || 'SISTEMA'}</div>
                    <small style={{ color: 'var(--color-text-muted)' }}>{log.usuario?.email || '-'}</small>
                  </td>
                  <td>
                    <span className={`badge ${getActionBadgeClass(log.accion)}`} style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                      {log.accion}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {log.ip || '-'}
                  </td>
                  <td style={{ fontSize: '0.9rem', color: 'var(--color-text-heading)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Info size={14} className="text-blue-500" style={{ flexShrink: 0 }} />
                      <span>{log.detalles || 'Acción sin descripción adicional'}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Auditoria;
