import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { Map, Printer, CheckCircle, AlertCircle, XCircle, Wifi, WifiOff, Battery } from 'lucide-react';

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

const Areas: React.FC = () => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveData, setLiveData] = useState<Record<string, { nivelAtb: number; nivelBtp: number; estadoConexion: string }>>({});

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await axios.get((import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/areas');
        if (response.data.success) {
          setAreas(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching areas', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAreas();

    const socket: Socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000');
    socket.on('kiosk_telemetry_update', (data) => {
      setLiveData(prev => ({
        ...prev,
        [data.kioskoId]: {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVO': return <CheckCircle size={16} color="var(--color-success)" />;
      case 'MANTENIMIENTO': return <AlertCircle size={16} color="var(--color-warning)" />;
      default: return <XCircle size={16} color="var(--color-danger)" />;
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Directorio de Áreas y Periféricos</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {loading ? (
          <div>Cargando...</div>
        ) : areas.length === 0 ? (
          <div className="card">No hay áreas registradas.</div>
        ) : (
          areas.map(area => (
            <div key={area.id} className="card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <Map size={20} color="var(--color-primary)" />
                <h3 style={{ margin: 0 }}>{area.nombre}</h3>
                <span style={{ marginLeft: 'auto', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  {area.terminal} - {area.zona}
                </span>
              </div>
              
              <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
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
                             </strong>
                           </div>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                               <Battery size={16} color={!isOnline ? 'gray' : btp < 10 ? 'red' : btp <= 20 ? 'orange' : 'green'} />
                               <span style={{ fontSize: '0.875rem', fontWeight: 500, color: !isOnline ? 'gray' : 'inherit' }}>Nivel BTP</span>
                             </div>
                             <strong style={{ fontSize: '1.1rem', color: !isOnline ? 'gray' : btp < 10 ? 'red' : btp <= 20 ? 'orange' : 'green' }}>
                               {btp}%
                             </strong>
                           </div>
                           {!isOnline && (
                             <div style={{ marginTop: '0.25rem', fontSize: '0.7rem', color: 'gray', textAlign: 'right', fontStyle: 'italic' }}>
                               *Última lectura conocida
                             </div>
                           )}
                        </div>
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
    </div>
  );
};

export default Areas;
