import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle, Search, Trash2, ShieldAlert, AlertTriangle, Database, Package, MapPin } from 'lucide-react';
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
  periferico?: { identificadorUnico: string; nivelAtb: number; nivelBtp: number };
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

  const getTabColor = (nivel?: number, fallbackIsNaranja?: boolean) => {
    if (nivel !== undefined) {
      if (nivel <= 10) {
        return {
          background: '#fee2e2',
          color: '#991b1b',
          border: '1px solid #fca5a5',
          fontWeight: 700
        };
      }
      return {
        background: '#fef3c7',
        color: '#92400e',
        border: '1px solid #fde68a',
        fontWeight: 700
      };
    }

    if (fallbackIsNaranja) {
      return {
        background: '#fef3c7',
        color: '#92400e',
        border: '1px solid #fde68a',
        fontWeight: 700
      };
    }

    return {
      background: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fca5a5',
      fontWeight: 700
    };
  };

  // Determina la severidad y el color de la tarjeta para cada alerta
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

    const isNaranja = msg.includes('NARANJA') || msg.includes('ÁMBAR') || msg.includes('AMBAR');
    const worstNivel = alerta.periferico ? Math.min(alerta.periferico.nivelAtb, alerta.periferico.nivelBtp) : undefined;
    const isCritico = worstNivel !== undefined ? worstNivel <= 10 : !isNaranja;

    if (isCritico) {
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

  const getKioskoCode = (mensaje: string): string => {
    const match = mensaje.match(/CUN\d[A-Z0-9]{5,}/i) || mensaje.match(/Kiosko\s+([A-Z0-9_-]+)/i);
    if (match) {
      return match[0].toUpperCase();
    }
    return '';
  };

  const filteredAlertas = alertas
    .filter(al => {
      const matchesBusqueda = al.mensaje.toLowerCase().includes(busqueda.toLowerCase()) ||
        (al.tipoPapel?.codigo || '').toLowerCase().includes(busqueda.toLowerCase());
      
      if (!matchesBusqueda) return false;

      if (filtroUbicacion === 'ALL') return true;
      if (filtroUbicacion === 'ALMACEN') {
        const msg = al.mensaje.toUpperCase();
        return msg.includes('GLOBAL') || msg.includes('ALMACÉN') || msg.includes('ALMACEN');
      }
      return al.mensaje.includes(filtroUbicacion);
    })
    .sort((a, b) => {
      const isGlobalA = a.mensaje.toUpperCase().includes('GLOBAL') || a.mensaje.toUpperCase().includes('ALMACÉN');
      const isGlobalB = b.mensaje.toUpperCase().includes('GLOBAL') || b.mensaje.toUpperCase().includes('ALMACÉN');

      if (isGlobalA && !isGlobalB) return -1;
      if (!isGlobalA && isGlobalB) return 1;

      const codeA = getKioskoCode(a.mensaje);
      const codeB = getKioskoCode(b.mensaje);

      if (codeA && codeB) {
        return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
      }

      if (codeA && !codeB) return -1;
      if (!codeA && codeB) return 1;

      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });

  const terminalStats = React.useMemo(() => {
    const stats: Record<string, { atb: number; btp: number; totalRollos: number; totalKioskos: Set<string> }> = {
      'Terminal 2': { atb: 0, btp: 0, totalRollos: 0, totalKioskos: new Set() },
      'Terminal 3': { atb: 0, btp: 0, totalRollos: 0, totalKioskos: new Set() },
      'Terminal 4': { atb: 0, btp: 0, totalRollos: 0, totalKioskos: new Set() },
    };

    alertas.filter(al => !al.leida).forEach(al => {
      const msg = al.mensaje.toUpperCase();
      let term = '';
      if (msg.includes('TERMINAL 2')) term = 'Terminal 2';
      else if (msg.includes('TERMINAL 3')) term = 'Terminal 3';
      else if (msg.includes('TERMINAL 4')) term = 'Terminal 4';

      if (term && stats[term]) {
        const code = getKioskoCode(al.mensaje);
        if (code) stats[term].totalKioskos.add(code);

        const showAtb = al.periferico ? al.periferico.nivelAtb <= 20 : (msg.includes('ATB') || msg.includes('ATB Y BTP'));
        const showBtp = al.periferico ? al.periferico.nivelBtp <= 20 : (msg.includes('BTP') || msg.includes('ATB Y BTP'));

        if (showAtb) {
          stats[term].atb += 1;
          stats[term].totalRollos += 1;
        }
        if (showBtp) {
          stats[term].btp += 1;
          stats[term].totalRollos += 1;
        }
      }
    });

    return stats;
  }, [alertas]);

  const totalGlobalAtb = Object.values(terminalStats).reduce((acc, t) => acc + t.atb, 0);
  const totalGlobalBtp = Object.values(terminalStats).reduce((acc, t) => acc + t.btp, 0);
  const totalGlobalRollos = totalGlobalAtb + totalGlobalBtp;

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

      {/* Recuadros Contadores de Rollos Requeridos por Terminal para Recorrido de Ingenieros */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b' }}>
            <Package className="text-blue-600" size={18} />
            Resumen de Rollos Requeridos para Recorrido en Campo
          </h3>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, background: '#e0e7ff', color: '#3730a3', padding: '0.3rem 0.85rem', borderRadius: '16px', border: '1px solid #c7d2fe' }}>
            Cargar en Carrito: <strong>{totalGlobalRollos} rollos</strong> ({totalGlobalAtb} ATB / {totalGlobalBtp} BTP)
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {Object.entries(terminalStats).map(([termName, stat]) => {
            const isSelected = filtroUbicacion === termName;
            return (
              <div 
                key={termName}
                className="card"
                onClick={() => setFiltroUbicacion(filtroUbicacion === termName ? 'ALL' : termName)}
                style={{
                  margin: 0,
                  padding: '1.1rem 1.25rem',
                  border: isSelected ? '2px solid var(--color-primary)' : '1px solid #cbd5e1',
                  background: isSelected ? '#eff6ff' : '#ffffff',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 4px 14px rgba(37,99,235,0.18)' : '0 2px 4px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                    <MapPin size={16} className="text-blue-600" />
                    <span>{termName}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600, background: '#f1f5f9', padding: '0.2rem 0.55rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    {stat.totalKioskos.size} kioskos
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <div style={{
                    background: stat.atb > 0 ? '#fee2e2' : '#f8fafc',
                    border: stat.atb > 0 ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '0.55rem 0.75rem',
                    textAlign: 'center'
                  }}>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: stat.atb > 0 ? '#991b1b' : '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                      ATB Requeridos
                    </span>
                    <strong style={{ fontSize: '1.15rem', color: stat.atb > 0 ? '#7f1d1d' : '#64748b', fontWeight: 800 }}>
                      {stat.atb} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>rollos</span>
                    </strong>
                  </div>

                  <div style={{
                    background: stat.btp > 0 ? '#fef3c7' : '#f8fafc',
                    border: stat.btp > 0 ? '1px solid #fde68a' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '0.55rem 0.75rem',
                    textAlign: 'center'
                  }}>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: stat.btp > 0 ? '#92400e' : '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                      BTP Requeridos
                    </span>
                    <strong style={{ fontSize: '1.15rem', color: stat.btp > 0 ? '#78350f' : '#64748b', fontWeight: 800 }}>
                      {stat.btp} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>rollos</span>
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
                  {/* Tabs/Badges de tipos de papel requeridos */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.6rem' }}>
                    {(() => {
                      const msg = al.mensaje.toUpperCase();
                      const isNaranjaMsg = msg.includes('NARANJA') || msg.includes('ÁMBAR') || msg.includes('AMBAR');

                      const styleAtb = getTabColor(al.periferico?.nivelAtb, isNaranjaMsg);
                      const styleBtp = getTabColor(al.periferico?.nivelBtp, isNaranjaMsg);

                      const showAtb = al.periferico ? al.periferico.nivelAtb <= 20 : (msg.includes('ATB') || msg.includes('ATB Y BTP'));
                      const showBtp = al.periferico ? al.periferico.nivelBtp <= 20 : (msg.includes('BTP') || msg.includes('ATB Y BTP'));

                      if (showAtb && showBtp) {
                        return (
                          <>
                            <span className="badge" style={{ fontSize: '0.75rem', textTransform: 'uppercase', padding: '0.2rem 0.55rem', borderRadius: '12px', ...styleAtb }}>
                              ATB-01
                            </span>
                            <span className="badge" style={{ fontSize: '0.75rem', textTransform: 'uppercase', padding: '0.2rem 0.55rem', borderRadius: '12px', ...styleBtp }}>
                              BTP-01
                            </span>
                          </>
                        );
                      }

                      if (showAtb) {
                        return (
                          <span className="badge" style={{ fontSize: '0.75rem', textTransform: 'uppercase', padding: '0.2rem 0.55rem', borderRadius: '12px', ...styleAtb }}>
                            ATB-01
                          </span>
                        );
                      }

                      if (showBtp) {
                        return (
                          <span className="badge" style={{ fontSize: '0.75rem', textTransform: 'uppercase', padding: '0.2rem 0.55rem', borderRadius: '12px', ...styleBtp }}>
                            BTP-01
                          </span>
                        );
                      }

                      const codigo = al.tipoPapel?.codigo || 'PAPEL';
                      return (
                        <span className="badge" style={{ fontSize: '0.75rem', textTransform: 'uppercase', padding: '0.2rem 0.55rem', borderRadius: '12px', ...styleAtb }}>
                          {codigo}
                        </span>
                      );
                    })()}
                  </div>
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
