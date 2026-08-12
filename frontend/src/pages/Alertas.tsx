import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle, Search, Trash2, ShieldAlert, AlertTriangle, Database } from 'lucide-react';
import { getAlertas, marcarAlertaComoLeida, marcarTodasComoLeidas } from '../services/alertasService';
import { format } from 'date-fns';
import { useAlerts } from '../context/AlertContext';

interface Alerta {
  id: string;
  mensaje: string;
  leida: boolean;
  fecha: string;
  tipoPapelId: string;
  tipoPapel?: { codigo: string; descripcion: string };
}

const Alertas: React.FC = () => {
  const { refrescarAlertas } = useAlerts();
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarLeidas, setMostrarLeidas] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroUbicacion, setFiltroUbicacion] = useState<string>('ALL');
  const [error, setError] = useState('');

  const fetchAlertas = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAlertas(mostrarLeidas);
      if (res.success) {
        setAlertas(res.data);
      } else {
        setError('No se pudo cargar el listado de alertas.');
      }
    } catch (err) {
      console.error(err);
      setError('Ocurrió un error al cargar las alertas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertas();
  }, [mostrarLeidas]);

  const handleMarcarLeida = async (id: string) => {
    try {
      const res = await marcarAlertaComoLeida(id);
      if (res.success) {
        setAlertas(prev => prev.map(al => al.id === id ? { ...al, leida: true } : al));
        await refrescarAlertas();
      }
    } catch (err) {
      console.error(err);
      alert('Error al marcar la alerta como leída.');
    }
  };

  const handleMarcarTodasLeidas = async () => {
    if (!window.confirm('¿Estás seguro de marcar todas las alertas pendientes como leídas?')) return;
    try {
      const res = await marcarTodasComoLeidas();
      if (res.success) {
        setAlertas(prev => prev.map(al => ({ ...al, leida: true })));
        await refrescarAlertas();
      }
    } catch (err) {
      console.error(err);
      alert('Error al marcar todas las alertas como leídas.');
    }
  };

  // Determina la severidad y el color del semáforo para cada alerta
  const getSemaforoStyle = (alerta: Alerta) => {
    if (alerta.leida) {
      return {
        border: '1px solid #cbd5e1',
        backgroundColor: '#f8fafc',
        icon: <CheckCircle className="text-gray-400" size={20} />,
        badgeText: 'Leída / Atendida',
        badgeClass: 'badge-secondary',
        textColor: '#64748b',
        opacity: 0.75
      };
    }

    const msg = alerta.mensaje.toUpperCase();
    
    // Alerta Global de Almacén (Azul)
    if (msg.includes('GLOBAL') || msg.includes('ALMACÉN') || msg.includes('ALMACEN')) {
      return {
        border: '1px solid var(--color-primary)',
        backgroundColor: 'var(--color-primary-glow)',
        icon: <Database className="text-blue-600" size={20} />,
        badgeText: 'Crítico Stock Almacén',
        badgeClass: 'badge-primary',
        textColor: 'var(--color-primary-dark)',
        opacity: 1
      };
    }

    // Alerta Crítica Kiosko (Rojo)
    if (msg.includes('CRÍTICO') || msg.includes('CRITICO') || msg.includes('OFFLINE') || msg.includes('5%') || msg.includes('0%')) {
      return {
        border: '1px solid var(--color-danger)',
        backgroundColor: 'var(--color-danger-bg)',
        icon: <ShieldAlert className="text-red-600" size={20} />,
        badgeText: 'Crítico Kiosko',
        badgeClass: 'badge-danger',
        textColor: '#b91c1c',
        opacity: 1
      };
    }

    // Alerta de Advertencia Kiosko (Amarillo)
    return {
      border: '1px solid var(--color-warning)',
      backgroundColor: 'var(--color-warning-bg)',
      icon: <AlertTriangle className="text-amber-600" size={20} />,
      badgeText: 'Advertencia Kiosko',
      badgeClass: 'badge-warning',
      textColor: '#b45309',
      opacity: 1
    };
  };

  const filteredAlertas = alertas.filter(al => {
    const matchesBusqueda = al.mensaje.toLowerCase().includes(busqueda.toLowerCase()) ||
      (al.tipoPapel?.codigo || '').toLowerCase().includes(busqueda.toLowerCase());
    
    if (!matchesBusqueda) return false;

    if (filtroUbicacion === 'ALL') return true;
    if (filtroUbicacion === 'ALMACEN') {
      const msg = al.mensaje.toUpperCase();
      return msg.includes('GLOBAL') || msg.includes('ALMACÉN') || msg.includes('ALMACEN');
    }
    return al.mensaje.includes(filtroUbicacion);
  });

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell className="text-blue-600" />
            Panel de Alertas Inteligentes
          </h2>
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
            Inspección y gestión de alertas de stock en almacenes y periféricos.
          </p>
        </div>
        
        {!mostrarLeidas && alertas.some(al => !al.leida) && (
          <button 
            className="btn btn-primary" 
            style={{ background: 'var(--color-primary-dark)' }}
            onClick={handleMarcarTodasLeidas}
          >
            <CheckCircle size={18} />
            Marcar todas como leídas
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', padding: '1rem 1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 'var(--border-radius)', padding: '0.5rem 1rem', width: '280px', gap: '0.5rem' }}>
            <Search size={18} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar alertas..." 
              style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem', color: 'var(--color-text)' }}
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>

          <select
            className="input-field"
            style={{ padding: '0.45rem 2rem 0.45rem 0.75rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 'var(--border-radius)', fontSize: '0.875rem' }}
            value={filtroUbicacion}
            onChange={e => setFiltroUbicacion(e.target.value)}
          >
            <option value="ALL">Todas las Ubicaciones / Terminales</option>
            <option value="ALMACEN">Solo Almacenes</option>
            <option value="Terminal 2">Terminal 2</option>
            <option value="Terminal 3">Terminal 3</option>
            <option value="Terminal 4">Terminal 4</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text)', cursor: 'pointer' }} htmlFor="check-leidas">
            <input 
              type="checkbox" 
              id="check-leidas" 
              checked={mostrarLeidas} 
              onChange={e => setMostrarLeidas(e.target.checked)}
              style={{ marginRight: '0.5rem', width: '16px', height: '16px', verticalAlign: 'middle', cursor: 'pointer' }}
            />
            Mostrar alertas leídas / resueltas
          </label>
        </div>
      </div>

      {/* Grid de Alertas */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Cargando alertas...</div>
      ) : filteredAlertas.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
          No se encontraron alertas en este momento.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredAlertas.map(al => {
            const config = getSemaforoStyle(al);
            return (
              <div 
                key={al.id} 
                className="card" 
                style={{ 
                  margin: 0, 
                  border: config.border, 
                  backgroundColor: config.backgroundColor, 
                  opacity: config.opacity,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  padding: '1.25rem'
                }}
              >
                {/* Cabecera de Alerta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {config.icon}
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', color: config.textColor }}>
                      {config.badgeText}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {format(new Date(al.fecha), 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>

                {/* Mensaje de la Alerta */}
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 500, fontSize: '0.925rem', color: al.leida ? '#64748b' : '#0f172a', lineHeight: '1.4' }}>
                    {al.mensaje}
                  </p>
                  {al.tipoPapel && (
                    <span className="badge badge-primary" style={{ marginTop: '0.5rem', fontSize: '0.7rem', textTransform: 'uppercase', background: 'rgba(255,255,255,0.7)', border: '1px solid #cbd5e1' }}>
                      {al.tipoPapel.codigo}
                    </span>
                  )}
                </div>

                {/* Acciones */}
                {!al.leida && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                    <button 
                      onClick={() => handleMarcarLeida(al.id)}
                      className="btn" 
                      style={{ 
                        padding: '0.35rem 0.75rem', 
                        fontSize: '0.8rem', 
                        background: '#fff', 
                        color: config.textColor, 
                        borderColor: config.textColor, 
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.25rem' 
                      }}
                    >
                      <CheckCircle size={14} />
                      Atendida / Leída
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Alertas;
