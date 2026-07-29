import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Map, Printer, Wifi, WifiOff, Battery, Wrench, X } from 'lucide-react';
import api from '../services/api';

interface TipoCompatibilidad {
  tipoPapel: {
    codigo: string;
    descripcion: string;
  };
}

interface Periferico {
  id: string;
  identificadorUnico: string;
  marca: string;
  modelo: string;
  estadoOperativo: string;
  nivelAtb: number;
  nivelBtp: number;
  estadoConexion: string;
  tiposCompatibles: TipoCompatibilidad[];
}

interface Area {
  id: string;
  nombre: string;
  terminal: string;
  zona: string;
  perifericos: Periferico[];
}

interface Almacen {
  id: string;
  nombre: string;
  ubicacion: string;
}

const Areas: React.FC = () => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveData, setLiveData] = useState<Record<string, { nivelAtb: number; nivelBtp: number; estadoConexion: string }>>({});
  const [filterArea, setFilterArea] = useState<string>('Todas');

  // Modal states
  const [selectedKiosko, setSelectedKiosko] = useState<Periferico | null>(null);
  const [actionType, setActionType] = useState('Cambio de Papel ATB');
  const [selectedAlmacen, setSelectedAlmacen] = useState('');
  const [comentarios, setComentarios] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resAreas, resAlmacenes] = await Promise.all([
          api.get('/areas'),
          api.get('/almacenes')
        ]);
        if (resAreas.data.success) {
          setAreas(resAreas.data.data);
        }
        if (resAlmacenes.data.success) {
          setAlmacenes(resAlmacenes.data.data);
        }
      } catch (error) {
        console.error('Error fetching data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const socket: Socket = io((import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000')));
    socket.on('kiosk_telemetry_update', (data) => {
      setLiveData(prev => ({
        ...prev,
        [data.perifericoId || data.kioskoId]: { // Soporte para ambos nombres de campo temporalmente
          nivelAtb: data.nivelAtb,
          nivelBtp: data.nivelBtp,
          estadoConexion: data.estadoConexion
        }
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleRegisterAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKiosko) return;

    if (actionType.includes('Cambio de Papel') && !selectedAlmacen) {
      alert('Por favor selecciona el almacén de donde proviene el papel.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/intervenciones', {
        perifericoId: selectedKiosko.id,
        accion: actionType,
        almacenOrigenId: actionType.includes('Cambio de Papel') ? selectedAlmacen : undefined,
        comentarios
      });

      if (res.data.success) {
        alert('Acción registrada con éxito.');
        closeModal();
      }
    } catch (error) {
      console.error(error);
      alert('Error al registrar la acción.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setSelectedKiosko(null);
    setActionType('Cambio de Papel ATB');
    setSelectedAlmacen('');
    setComentarios('');
  };

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Directorio de Áreas y Periféricos</h2>
        </div>
        
        {/* Filtros de Área */}
        {!loading && areas.length > 0 && (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button 
              className={`badge ${filterArea === 'Todas' ? 'badge-primary' : ''}`} 
              style={{ cursor: 'pointer', border: '1px solid #e2e8f0', background: filterArea === 'Todas' ? '' : 'white', color: filterArea === 'Todas' ? '' : 'var(--color-text-muted)', fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              onClick={() => setFilterArea('Todas')}
            >
              Todas las Áreas
            </button>
            {areas.map(a => (
              <button 
                key={a.id}
                className={`badge ${filterArea === a.id ? 'badge-primary' : ''}`}
                style={{ cursor: 'pointer', border: '1px solid #e2e8f0', background: filterArea === a.id ? '' : 'white', color: filterArea === a.id ? '' : 'var(--color-text-muted)', fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                onClick={() => setFilterArea(a.id)}
              >
                {a.nombre}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {loading ? (
          <div>Cargando...</div>
        ) : areas.length === 0 ? (
          <div className="card">No hay áreas registradas.</div>
        ) : (
          areas.filter(area => filterArea === 'Todas' || area.id === filterArea).map(area => (
            <div key={area.id} className="card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <Map size={20} color="var(--color-primary)" />
                <h3 style={{ margin: 0 }}>{area.nombre}</h3>
                <span style={{ marginLeft: 'auto', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  {area.terminal} - {area.zona}
                </span>
              </div>
              
              <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto', paddingRight: '0.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {area.perifericos.length === 0 ? (
                     <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>Sin periféricos asignados</p>
                  ) : (
                  area.perifericos.map(p => {
                    const isOnline = (liveData[p.id]?.estadoConexion ?? p.estadoConexion) === 'ONLINE';
                    const atb = liveData[p.id]?.nivelAtb ?? p.nivelAtb ?? 100;
                    const btp = liveData[p.id]?.nivelBtp ?? p.nivelBtp ?? 100;
                    const worstPaper = Math.min(atb, btp);
                    
                    let borderColor = 'var(--color-success)';
                    let statusBg = '#dcfce7';
                    let statusColor = 'var(--color-success)';
                    
                    if (!isOnline) {
                      borderColor = 'var(--color-text-muted)';
                      statusBg = '#f1f5f9';
                      statusColor = 'var(--color-text-muted)';
                    } else if (worstPaper < 10) {
                      borderColor = 'var(--color-danger)';
                      statusBg = '#fee2e2';
                      statusColor = 'var(--color-danger)';
                    } else if (worstPaper <= 20) {
                      borderColor = 'var(--color-warning)';
                      statusBg = '#fef3c7';
                      statusColor = 'var(--color-warning)';
                    }

                    return (
                      <div key={p.id} style={{ border: `2px solid ${borderColor}`, borderRadius: '8px', padding: '1rem', background: '#fff', position: 'relative', overflow: 'hidden' }}>
                        
                        {/* Indicador superior */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: borderColor }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', marginTop: '0.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '1.1rem' }}>
                            <Printer size={18} color={borderColor} />
                            {p.identificadorUnico}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', background: statusBg, color: statusColor, padding: '0.25rem 0.5rem', borderRadius: '12px', fontWeight: 'bold' }}>
                            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                            {isOnline ? 'ONLINE' : 'OFFLINE'}
                          </div>
                        </div>
                        
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: '0 0 1rem 0' }}>
                          {p.marca} {p.modelo}
                        </p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                               <Battery size={16} color={!isOnline ? 'gray' : atb < 10 ? 'red' : atb <= 20 ? 'orange' : 'green'} />
                               <span style={{ fontSize: '0.875rem', fontWeight: 500, color: !isOnline ? 'gray' : 'inherit' }}>Nivel ATB</span>
                             </div>
                             <strong style={{ fontSize: '1.1rem', color: !isOnline ? 'gray' : atb < 10 ? 'red' : atb <= 20 ? 'orange' : 'green' }}>
                               {atb}%
                               {!isOnline && <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 'normal', marginTop: '-4px' }}>(Últ. registro)</span>}
                             </strong>
                           </div>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                               <Battery size={16} color={!isOnline ? 'gray' : btp < 10 ? 'red' : btp <= 20 ? 'orange' : 'green'} />
                               <span style={{ fontSize: '0.875rem', fontWeight: 500, color: !isOnline ? 'gray' : 'inherit' }}>Nivel BTP</span>
                             </div>
                             <strong style={{ fontSize: '1.1rem', color: !isOnline ? 'gray' : btp < 10 ? 'red' : btp <= 20 ? 'orange' : 'green' }}>
                               {btp}%
                               {!isOnline && <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 'normal', marginTop: '-4px' }}>(Últ. registro)</span>}
                             </strong>
                           </div>
                        </div>

                        {/* Botón de Intervención */}
                        <button 
                          className="btn btn-secondary w-full" 
                          style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.875rem', padding: '0.5rem' }}
                          onClick={() => setSelectedKiosko(p)}
                        >
                          <Wrench size={16} />
                          Registrar Acción
                        </button>
                      </div>
                    );
                  })
                )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Intervención */}
      {selectedKiosko && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wrench className="text-blue-500" size={24} />
                Acción en Sitio
              </h2>
              <button className="btn-icon" onClick={closeModal}><X /></button>
            </div>
            
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', marginTop: 0 }}>
              Kiosko: <strong>{selectedKiosko.identificadorUnico}</strong>
            </p>

            <form onSubmit={handleRegisterAction}>
              <div className="form-group">
                <label>Tipo de Acción *</label>
                <select 
                  className="input-field" 
                  value={actionType} 
                  onChange={e => setActionType(e.target.value)}
                  required
                >
                  <option value="Cambio de Papel ATB">Cambio de Papel ATB</option>
                  <option value="Cambio de Papel BTP">Cambio de Papel BTP</option>
                  <option value="Reset Físico (Reinicio)">Reset Físico (Reinicio)</option>
                  <option value="Limpieza de Rodillos / Sensores">Limpieza de Rodillos / Sensores</option>
                  <option value="Calibración">Calibración</option>
                  <option value="Mantenimiento Correctivo (Otro)">Mantenimiento Correctivo (Otro)</option>
                </select>
              </div>

              {actionType.includes('Cambio de Papel') && (
                <div className="form-group">
                  <label>Origen del Papel (Almacén) *</label>
                  <select 
                    className="input-field" 
                    value={selectedAlmacen} 
                    onChange={e => setSelectedAlmacen(e.target.value)}
                    required
                  >
                    <option value="">-- Selecciona el Almacén --</option>
                    {almacenes.map(almacen => (
                      <option key={almacen.id} value={almacen.id}>
                        {almacen.nombre} ({almacen.ubicacion})
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: '0.75rem', color: 'gray' }}>Indica de qué bodega tomaste el nuevo rollo.</span>
                </div>
              )}

              <div className="form-group">
                <label>Comentarios / Observaciones</label>
                <textarea 
                  className="input-field" 
                  rows={3} 
                  placeholder="Detalles de la acción realizada..."
                  value={comentarios}
                  onChange={e => setComentarios(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={isSubmitting}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : 'Registrar Acción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Areas;
