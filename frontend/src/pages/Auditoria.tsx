import React, { useEffect, useState, useMemo } from 'react';
import { Shield, Search, RefreshCw, Info, Calendar, Filter, FileSpreadsheet, Layers, User, Tag } from 'lucide-react';
import api from '../services/api';
import { format } from 'date-fns';
import { exportToExcel } from '../utils/exportUtils';

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
  fecha: string;
}

const Auditoria: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtros
  const [criterioBusqueda, setCriterioBusqueda] = useState<string>('TODO');
  const [textoBusqueda, setTextoBusqueda] = useState<string>('');
  const [filtroFecha, setFiltroFecha] = useState<string>('');
  const [filtroAccion, setFiltroAccion] = useState<string>('');

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
      case 'REGISTRO_MOVIMIENTO':
        return 'badge-primary';
      case 'ACTUALIZACION_SEMAFORO':
        return 'badge-warning';
      case 'REPORTE_DISCREPANCIA':
      case 'CAMBIO_ESTADO_INCIDENTE':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  // Obtener lista única de acciones para el selector
  const accionesDisponibles = useMemo(() => {
    const setAcciones = new Set<string>();
    logs.forEach(l => {
      if (l.accion) setAcciones.add(l.accion);
    });
    return Array.from(setAcciones);
  }, [logs]);

  // Filtrado dinámico según el criterio seleccionado
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const query = textoBusqueda.toLowerCase().trim();
      const fechaFormatted = format(new Date(log.fecha), 'dd/MM/yyyy HH:mm:ss').toLowerCase();
      const nombreIngeniero = (log.usuario?.nombre || 'SISTEMA').toLowerCase();
      const emailIngeniero = (log.usuario?.email || '').toLowerCase();
      const accionStr = (log.accion || '').toLowerCase();
      const detallesStr = (log.detalles || '').toLowerCase();

      // Filtro por fecha en formato YYYY-MM-DD
      if (filtroFecha) {
        const logFechaISO = new Date(log.fecha).toISOString().slice(0, 10);
        if (logFechaISO !== filtroFecha) return false;
      }

      // Filtro por tipo de Acción directo
      if (filtroAccion && log.accion !== filtroAccion) {
        return false;
      }

      // Búsqueda por texto según Criterio seleccionado
      if (!query) return true;

      switch (criterioBusqueda) {
        case 'FECHA':
          return fechaFormatted.includes(query);
        case 'INGENIERO':
          return nombreIngeniero.includes(query) || emailIngeniero.includes(query);
        case 'ACCION':
          return accionStr.includes(query);
        case 'DETALLES':
          return detallesStr.includes(query);
        case 'TODO':
        default:
          return (
            fechaFormatted.includes(query) ||
            nombreIngeniero.includes(query) ||
            emailIngeniero.includes(query) ||
            accionStr.includes(query) ||
            detallesStr.includes(query)
          );
      }
    });
  }, [logs, criterioBusqueda, textoBusqueda, filtroFecha, filtroAccion]);

  const handleExportExcel = () => {
    if (filteredLogs.length === 0) return;
    const dataToExport = filteredLogs.map(l => ({
      'Fecha y Hora': format(new Date(l.fecha), 'dd/MM/yyyy HH:mm:ss'),
      'Ingeniero / Usuario': l.usuario?.nombre || 'SISTEMA',
      'Email': l.usuario?.email || '-',
      'Acción': l.accion,
      'Entidad / Módulo': l.entidad || '-',
      'Detalles de la Actividad': l.detalles || '-'
    }));

    exportToExcel(dataToExport, 'Bitácora de Auditoría y Seguridad', 'reporte_auditoria');
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield className="text-blue-600" />
            Bitácora de Auditoría y Seguridad
          </h2>
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
            Historial detallado de accesos y actividades registradas por ingenieros de campo.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn" 
            style={{ background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={handleExportExcel}
            disabled={loading || filteredLogs.length === 0}
          >
            <FileSpreadsheet size={16} />
            Exportar Auditoría
          </button>
          
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
      </div>

      {error && (
        <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Panel de Filtros Inteligentes */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          
          {/* Criterio de Búsqueda */}
          <div>
            <label className="form-label" style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#475569' }}>
              <Filter size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Filtrar por Criterio:
            </label>
            <select 
              className="input-field" 
              style={{ margin: 0, background: 'white' }}
              value={criterioBusqueda}
              onChange={(e) => setCriterioBusqueda(e.target.value)}
            >
              <option value="TODO">🔍 TODO (Búsqueda General)</option>
              <option value="FECHA">📅 FECHA Y HORA</option>
              <option value="INGENIERO">👤 INGENIERO / USUARIO</option>
              <option value="ACCION">🏷️ ACCIÓN</option>
              <option value="DETALLES">📝 DETALLES DE LA ACTIVIDAD</option>
            </select>
          </div>

          {/* Campo de Búsqueda por Texto */}
          <div>
            <label className="form-label" style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#475569' }}>
              Texto a Buscar:
            </label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.45rem 0.75rem', gap: '0.5rem' }}>
              <Search size={16} className="text-gray-400" />
              <input 
                type="text" 
                placeholder={`Buscar por ${criterioBusqueda.toLowerCase()}...`}
                style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' }}
                value={textoBusqueda}
                onChange={e => setTextoBusqueda(e.target.value)}
              />
            </div>
          </div>

          {/* Selector de Fecha */}
          <div>
            <label className="form-label" style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#475569' }}>
              <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Filtrar por Fecha Específica:
            </label>
            <input 
              type="date"
              className="input-field"
              style={{ margin: 0, background: 'white' }}
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
            />
          </div>

          {/* Selector Tipo de Acción */}
          <div>
            <label className="form-label" style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#475569' }}>
              <Tag size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Tipo de Acción:
            </label>
            <select 
              className="input-field"
              style={{ margin: 0, background: 'white' }}
              value={filtroAccion}
              onChange={(e) => setFiltroAccion(e.target.value)}
            >
              <option value="">Todas las Acciones</option>
              {accionesDisponibles.map(acc => (
                <option key={acc} value={acc}>{acc}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Listado de Logs (Sin columna IP) */}
      <div className="card table-container" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Cargando bitácora de actividad...</div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            No se encontraron registros de auditoría para los filtros seleccionados.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>FECHA Y HORA</th>
                <th>INGENIERO</th>
                <th>ACCIÓN</th>
                <th>MÓDULO AFECTADO</th>
                <th>DETALLES DE LA ACTIVIDAD</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.875rem', fontWeight: 500, color: '#334155' }}>
                    {format(new Date(log.fecha), 'dd/MM/yyyy HH:mm:ss')}
                  </td>
                  <td>
                    <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{log.usuario?.nombre || 'SISTEMA'}</div>
                    <small style={{ color: 'var(--color-text-muted)' }}>{log.usuario?.email || '-'}</small>
                  </td>
                  <td>
                    <span className={`badge ${getActionBadgeClass(log.accion)}`} style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                      {log.accion}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', background: '#e2e8f0', borderRadius: '4px', color: '#475569', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Layers size={12} />
                      {log.entidad || 'Sistema'}
                    </span>
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
