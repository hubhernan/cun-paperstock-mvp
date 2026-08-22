import React, { useEffect, useState, useMemo } from 'react';
import { Shield, Search, RefreshCw, Info, Calendar, Filter, FileSpreadsheet, Layers, User, Tag, Eraser, CheckCircle2, AlertTriangle, Activity, Clock } from 'lucide-react';
import api from '../services/api';
import { format } from 'date-fns';
import { exportToExcel } from '../utils/exportUtils';

interface AuditLog {
  id: string;
  usuarioId: string;
  usuario: {
    id?: string;
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
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [filtroAccion, setFiltroAccion] = useState<string>('');
  const [filtroUsuario, setFiltroUsuario] = useState<string>('');
  const [categoriaRapida, setCategoriaRapida] = useState<string>('TODAS');
  
  // Paginación
  const [filasPorPagina, setFilasPorPagina] = useState<number>(50);
  const [paginaActual, setPaginaActual] = useState<number>(1);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (fechaInicio) params.fechaInicio = fechaInicio;
      if (fechaFin) params.fechaFin = fechaFin;
      if (filtroUsuario) params.usuarioId = filtroUsuario;
      if (filtroAccion) params.accion = filtroAccion;

      const res = await api.get('/auditoria', { params });
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
  }, [fechaInicio, fechaFin, filtroUsuario, filtroAccion]);

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
      case 'REPORTE_DISCREPANCIA_ALMACEN':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  // Lista única de acciones y usuarios para filtros desplegables
  const { accionesDisponibles, usuariosDisponibles } = useMemo(() => {
    const setAcciones = new Set<string>();
    const mapUsuarios = new Map<string, string>();

    logs.forEach(l => {
      if (l.accion) setAcciones.add(l.accion);
      if (l.usuario && l.usuario.id) {
        mapUsuarios.set(l.usuario.id, l.usuario.nombre || l.usuario.email);
      }
    });

    return {
      accionesDisponibles: Array.from(setAcciones).sort(),
      usuariosDisponibles: Array.from(mapUsuarios.entries()).map(([id, nombre]) => ({ id, nombre }))
    };
  }, [logs]);

  // Filtrado dinámico client-side súper rápido
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const query = textoBusqueda.toLowerCase().trim();
      const fechaFormatted = format(new Date(log.fecha), 'dd/MM/yyyy HH:mm:ss').toLowerCase();
      const nombreIngeniero = (log.usuario?.nombre || 'SISTEMA').toLowerCase();
      const emailIngeniero = (log.usuario?.email || '').toLowerCase();
      const accionStr = (log.accion || '').toLowerCase();
      const entidadStr = (log.entidad || '').toLowerCase();
      const detallesStr = (log.detalles || '').toLowerCase();

      // Categoría Rápida (Chips)
      if (categoriaRapida === 'INTERVENCIONES' && !accionStr.includes('intervencion')) return false;
      if (categoriaRapida === 'MOVIMIENTOS' && !accionStr.includes('movimiento') && !detallesStr.includes('traspaso') && !detallesStr.includes('recepcion')) return false;
      if (categoriaRapida === 'SESIONES' && !accionStr.includes('login') && !accionStr.includes('logout')) return false;
      if (categoriaRapida === 'INCIDENTES' && !accionStr.includes('incidente') && !accionStr.includes('discrepancia')) return false;

      // Filtro por usuario específico
      if (filtroUsuario && log.usuario?.id !== filtroUsuario) return false;

      // Filtro por tipo de Acción directo
      if (filtroAccion && log.accion !== filtroAccion) return false;

      // Búsqueda por texto según Criterio seleccionado
      if (!query) return true;

      switch (criterioBusqueda) {
        case 'FECHA':
          return fechaFormatted.includes(query);
        case 'INGENIERO':
          return nombreIngeniero.includes(query) || emailIngeniero.includes(query);
        case 'ACCION':
          return accionStr.includes(query);
        case 'ENTIDAD':
          return entidadStr.includes(query);
        case 'DETALLES':
          return detallesStr.includes(query);
        case 'TODO':
        default:
          return (
            fechaFormatted.includes(query) ||
            nombreIngeniero.includes(query) ||
            emailIngeniero.includes(query) ||
            accionStr.includes(query) ||
            entidadStr.includes(query) ||
            detallesStr.includes(query)
          );
      }
    });
  }, [logs, criterioBusqueda, textoBusqueda, filtroAccion, filtroUsuario, categoriaRapida]);

  // Paginación eficiente
  const paginatedLogs = useMemo(() => {
    if (filasPorPagina === 0) return filteredLogs;
    const startIndex = (paginaActual - 1) * filasPorPagina;
    return filteredLogs.slice(startIndex, startIndex + filasPorPagina);
  }, [filteredLogs, paginaActual, filasPorPagina]);

  const totalPaginas = useMemo(() => {
    if (filasPorPagina === 0 || filteredLogs.length === 0) return 1;
    return Math.ceil(filteredLogs.length / filasPorPagina);
  }, [filteredLogs, filasPorPagina]);

  const handleLimpiarFiltros = () => {
    setCriterioBusqueda('TODO');
    setTextoBusqueda('');
    setFechaInicio('');
    setFechaFin('');
    setFiltroAccion('');
    setFiltroUsuario('');
    setCategoriaRapida('TODAS');
    setPaginaActual(1);
  };

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

  // Estadísticas del resumen de auditoría
  const usuariosUnicosCount = useMemo(() => {
    const setUsers = new Set();
    filteredLogs.forEach(l => {
      if (l.usuario?.nombre) setUsers.add(l.usuario.nombre);
    });
    return setUsers.size;
  }, [filteredLogs]);

  const ultimaActividadFormatted = useMemo(() => {
    if (filteredLogs.length === 0) return 'Sin registros';
    return format(new Date(filteredLogs[0].fecha), 'dd/MM/yyyy HH:mm');
  }, [filteredLogs]);

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
            Inspección ágil de eventos, accesos e intervenciones registradas en el aeropuerto.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            className="btn" 
            style={{ background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={handleExportExcel}
            disabled={loading || filteredLogs.length === 0}
          >
            <FileSpreadsheet size={16} />
            Exportar a Excel ({filteredLogs.length})
          </button>
          
          <button 
            className="btn btn-secondary" 
            onClick={fetchLogs}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refrescar
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Recuadros Resumen de Rendimiento de Auditoría */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ margin: 0, padding: '1rem 1.25rem', borderLeft: '4px solid #2563eb', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#eff6ff', padding: '0.75rem', borderRadius: '10px', color: '#2563eb' }}>
            <Activity size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Eventos Filtrados</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
              {filteredLogs.length} <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>/ {logs.length} tot.</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ margin: 0, padding: '1rem 1.25rem', borderLeft: '4px solid #10b981', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#ecfdf5', padding: '0.75rem', borderRadius: '10px', color: '#10b981' }}>
            <User size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Ingenieros Activos</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
              {usuariosUnicosCount} <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>usuarios</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ margin: 0, padding: '1rem 1.25rem', borderLeft: '4px solid #8b5cf6', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#f5f3ff', padding: '0.75rem', borderRadius: '10px', color: '#8b5cf6' }}>
            <Clock size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Última Actividad</span>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
              {ultimaActividadFormatted}
            </div>
          </div>
        </div>
      </div>

      {/* Categorías Rápidas (Chips de 1-Clic) */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginRight: '0.25rem' }}>Categorías Rápidas:</span>
        {[
          { id: 'TODAS', label: 'Todas las Actividades' },
          { id: 'INTERVENCIONES', label: '🛠️ Intervenciones' },
          { id: 'MOVIMIENTOS', label: '📦 Movimientos Inventario' },
          { id: 'SESIONES', label: '🔐 Accesos (Logins)' },
          { id: 'INCIDENTES', label: '⚠️ Incidentes & Discrepancias' },
        ].map(chip => {
          const isActive = categoriaRapida === chip.id;
          return (
            <button
              key={chip.id}
              onClick={() => { setCategoriaRapida(chip.id); setPaginaActual(1); }}
              style={{
                background: isActive ? '#2563eb' : '#ffffff',
                color: isActive ? '#ffffff' : '#334155',
                border: isActive ? '1px solid #2563eb' : '1px solid #cbd5e1',
                padding: '0.35rem 0.85rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 2px 8px rgba(37,99,235,0.25)' : 'none'
              }}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Panel de Filtros Inteligentes Avanzados */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          
          {/* Campo de Búsqueda por Texto Instantánea */}
          <div style={{ gridColumn: 'span 2' }}>
            <label className="form-label" style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#475569' }}>
              🔍 Búsqueda Inteligente Instantánea:
            </label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.55rem 0.85rem', gap: '0.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              <Search size={18} className="text-blue-600" />
              <input 
                type="text" 
                placeholder="Buscar por ingeniero, módulo, folio, kiosko, acción o palabra clave..."
                style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' }}
                value={textoBusqueda}
                onChange={e => { setTextoBusqueda(e.target.value); setPaginaActual(1); }}
              />
              {textoBusqueda && (
                <button 
                  onClick={() => setTextoBusqueda('')} 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}
                  title="Limpiar texto"
                >
                  <Eraser size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Criterio de Búsqueda Especifico */}
          <div>
            <label className="form-label" style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#475569' }}>
              <Filter size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Buscar en Campo:
            </label>
            <select 
              className="input-field" 
              style={{ margin: 0, background: 'white', borderRadius: '8px' }}
              value={criterioBusqueda}
              onChange={(e) => { setCriterioBusqueda(e.target.value); setPaginaActual(1); }}
            >
              <option value="TODO">🌐 TODO (Todos los campos)</option>
              <option value="INGENIERO">👤 Ingeniero / Usuario</option>
              <option value="ACCION">🏷️ Tipo de Acción</option>
              <option value="ENTIDAD">📦 Módulo Aflicto</option>
              <option value="DETALLES">📝 Detalles de Actividad</option>
            </select>
          </div>

          {/* Selector de Ingeniero / Usuario */}
          <div>
            <label className="form-label" style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#475569' }}>
              <User size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Filtrar por Ingeniero:
            </label>
            <select 
              className="input-field"
              style={{ margin: 0, background: 'white', borderRadius: '8px' }}
              value={filtroUsuario}
              onChange={(e) => { setFiltroUsuario(e.target.value); setPaginaActual(1); }}
            >
              <option value="">Todos los Usuarios</option>
              {usuariosDisponibles.map(u => (
                <option key={u.id} value={u.id}>{u.nombre}</option>
              ))}
            </select>
          </div>

          {/* Fecha Desde */}
          <div>
            <label className="form-label" style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#475569' }}>
              <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Fecha Desde:
            </label>
            <input 
              type="date"
              className="input-field"
              style={{ margin: 0, background: 'white', borderRadius: '8px' }}
              value={fechaInicio}
              onChange={(e) => { setFechaInicio(e.target.value); setPaginaActual(1); }}
            />
          </div>

          {/* Fecha Hasta */}
          <div>
            <label className="form-label" style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#475569' }}>
              <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Fecha Hasta:
            </label>
            <input 
              type="date"
              className="input-field"
              style={{ margin: 0, background: 'white', borderRadius: '8px' }}
              value={fechaFin}
              onChange={(e) => { setFechaFin(e.target.value); setPaginaActual(1); }}
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
              style={{ margin: 0, background: 'white', borderRadius: '8px' }}
              value={filtroAccion}
              onChange={(e) => { setFiltroAccion(e.target.value); setPaginaActual(1); }}
            >
              <option value="">Todas las Acciones</option>
              {accionesDisponibles.map(acc => (
                <option key={acc} value={acc}>{acc}</option>
              ))}
            </select>
          </div>

          {/* Botón Reset Filtros */}
          <div>
            <button
              className="btn btn-secondary"
              onClick={handleLimpiarFiltros}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', borderRadius: '8px', background: '#e2e8f0', color: '#334155' }}
            >
              <Eraser size={16} />
              Limpiar Filtros
            </button>
          </div>

        </div>
      </div>

      {/* Listado de Logs de Auditoría */}
      <div className="card table-container" style={{ padding: 0, borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Cargando bitácora de actividad...</div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            No se encontraron registros de auditoría para los criterios o fechas seleccionadas.
          </div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>FECHA Y HORA</th>
                  <th>INGENIERO / USUARIO</th>
                  <th>ACCIÓN</th>
                  <th>MÓDULO AFECTADO</th>
                  <th>DETALLES DE LA ACTIVIDAD</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map(log => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                      {format(new Date(log.fecha), 'dd/MM/yyyy HH:mm:ss')}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{log.usuario?.nombre || 'SISTEMA'}</div>
                      <small style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{log.usuario?.email || '-'}</small>
                    </td>
                    <td>
                      <span className={`badge ${getActionBadgeClass(log.accion)}`} style={{ textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.3px' }}>
                        {log.accion}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.78rem', padding: '0.2rem 0.55rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', color: '#475569', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Layers size={12} className="text-blue-500" />
                        {log.entidad || 'Sistema'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--color-text-heading)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Info size={14} className="text-blue-500" style={{ flexShrink: 0 }} />
                        <span>{log.detalles || 'Acción sin descripción adicional'}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Barra de Paginación y Controles */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.25rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.825rem', color: '#64748b' }}>
                Mostrando <strong>{paginatedLogs.length}</strong> de <strong>{filteredLogs.length}</strong> registros (Página {paginaActual} de {totalPaginas})
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', color: '#475569' }}>
                  <span>Filas por página:</span>
                  <select 
                    value={filasPorPagina} 
                    onChange={e => { setFilasPorPagina(Number(e.target.value)); setPaginaActual(1); }}
                    style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white' }}
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={0}>Todas</option>
                  </select>
                </div>

                {totalPaginas > 1 && (
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
                      disabled={paginaActual === 1}
                      onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                    >
                      Anterior
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
                      disabled={paginaActual === totalPaginas}
                      onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Auditoria;
