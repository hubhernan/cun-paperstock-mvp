import React, { useEffect, useState } from 'react';
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
  const [filterArea, setFilterArea] = useState<string>('Todas');

  // Modal states
  const [selectedKiosko, setSelectedKiosko] = useState<Periferico | null>(null);
  const [selectedAreaOfKiosko, setSelectedAreaOfKiosko] = useState<Area | null>(null);
  const [actionType, setActionType] = useState('Cambio de Papel ATB');
  const [selectedAlmacen, setSelectedAlmacen] = useState('');
  const [comentarios, setComentarios] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Manual levels inputs
  const [nivelAtbInput, setNivelAtbInput] = useState(100);
  const [nivelBtpInput, setNivelBtpInput] = useState(100);
  const [estadoConexionInput, setEstadoConexionInput] = useState('ONLINE');

  const getAlmacenesCompatibles = (kiosko: Periferico | null, areaOfKiosko?: Area | null) => {
    if (!kiosko) return almacenes;
    const id = kiosko.identificadorUnico.toUpperCase();
    const terminalArea = (areaOfKiosko?.terminal || areaOfKiosko?.nombre || '').toUpperCase();

    let targetTerm = '';
    if (id.includes('CUN2') || terminalArea.includes('TERMINAL 2') || terminalArea.includes('T2')) {
      targetTerm = '2';
    } else if (id.includes('CUN3') || terminalArea.includes('TERMINAL 3') || terminalArea.includes('T3')) {
      targetTerm = '3';
    } else if (id.includes('CUN4') || terminalArea.includes('TERMINAL 4') || terminalArea.includes('T4')) {
      targetTerm = '4';
    }

    if (targetTerm) {
      const filtrados = almacenes.filter(a => {
        const nombre = a.nombre.toUpperCase();
        const ubi = (a.ubicacion || '').toUpperCase();
        if (targetTerm === '2') return nombre.includes('CENTRAL') || nombre.includes('TERMINAL 2') || ubi.includes('TERMINAL 2') || ubi.includes('T2');
        if (targetTerm === '3') return nombre.includes('TERMINAL 3') || ubi.includes('TERMINAL 3') || ubi.includes('T3');
        if (targetTerm === '4') return nombre.includes('TERMINAL 4') || ubi.includes('TERMINAL 4') || ubi.includes('T4');
        return true;
      });
      if (filtrados.length > 0) return filtrados;
    }
    return almacenes;
  };

  const handleOpenModal = (kiosko: Periferico, area: Area) => {
    setSelectedKiosko(kiosko);
    setSelectedAreaOfKiosko(area);
    setActionType('Cambio de Papel ATB');
    setComentarios('');
    setModalError('');

    const compatibles = getAlmacenesCompatibles(kiosko, area);
    if (compatibles.length > 0) {
      setSelectedAlmacen(compatibles[0].id);
    } else {
      setSelectedAlmacen('');
    }
  };

  const handleUpdateSemaforo = async (perifericoId: string, tipo: 'ATB' | 'BTP', nuevoNivel: number) => {
    // Actualización inmediata local sin tocar el otro tipo de papel
    setAreas(prevAreas => 
      prevAreas.map(area => ({
        ...area,
        perifericos: area.perifericos.map(p => {
          if (p.id === perifericoId) {
            return {
              ...p,
              nivelAtb: tipo === 'ATB' ? nuevoNivel : p.nivelAtb,
              nivelBtp: tipo === 'BTP' ? nuevoNivel : p.nivelBtp,
            };
          }
          return p;
        })
      }))
    );

    try {
      const payload = tipo === 'ATB' ? { nivelAtb: nuevoNivel } : { nivelBtp: nuevoNivel };
      await api.patch(`/perifericos/${perifericoId}/nivel`, payload);
    } catch (err) {
      console.error('Error al actualizar semáforo', err);
      fetchData(); // En caso de fallo de red, sincronizar estado original
    }
  };

  useEffect(() => {
    if (selectedKiosko) {
      setNivelAtbInput(selectedKiosko.nivelAtb ?? 100);
      setNivelBtpInput(selectedKiosko.nivelBtp ?? 100);
      setEstadoConexionInput(selectedKiosko.estadoConexion ?? 'ONLINE');
    }
  }, [selectedKiosko]);

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

  useEffect(() => {
    fetchData();
  }, []);

  const handleRegisterAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKiosko) return;
    setModalError('');

    if (!selectedAlmacen) {
      setModalError('Por favor selecciona el almacén de donde proviene el papel.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const payload: any = {
        perifericoId: selectedKiosko.id,
        accion: actionType,
        comentarios,
        almacenOrigenId: selectedAlmacen
      };

      const res = await api.post('/intervenciones', payload);

      if (res.data.success) {
        alert('Acción registrada con éxito.');
        await fetchData();
        closeModal();
      }
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.message || error.message || 'Error al registrar la acción.';
      setModalError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setSelectedKiosko(null);
    setSelectedAreaOfKiosko(null);
    setActionType('Cambio de Papel ATB');
    setSelectedAlmacen('');
    setComentarios('');
    setModalError('');
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
                    const atb = p.nivelAtb ?? 100;
                    const btp = p.nivelBtp ?? 100;
                    
                    const getEstadoInsumo = (nivel: number) => {
                      if (nivel < 10) return 'ROJO';
                      if (nivel <= 20) return 'NARANJA';
                      return 'VERDE';
                    };

                    const estadoATB = getEstadoInsumo(atb);
                    const estadoBTP = getEstadoInsumo(btp);

                    let statusColor = '#10b981';
                    let glowBoxShadow = '0 0 10px rgba(16, 185, 129, 0.25)';

                    if (estadoATB === 'ROJO' || estadoBTP === 'ROJO') {
                      statusColor = '#ef4444';
                      glowBoxShadow = '0 0 15px rgba(239, 68, 68, 0.45)';
                    } else if (estadoATB === 'NARANJA' || estadoBTP === 'NARANJA') {
                      statusColor = '#f59e0b';
                      glowBoxShadow = '0 0 12px rgba(245, 158, 11, 0.35)';
                    }

                    return (
                      <div 
                        key={p.id} 
                        style={{ 
                          border: `2px solid ${statusColor}`, 
                          boxShadow: glowBoxShadow,
                          borderRadius: '10px', 
                          padding: '1rem', 
                          background: '#fff', 
                          position: 'relative', 
                          overflow: 'hidden',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {/* Indicador superior */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: statusColor }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', marginTop: '0.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.15rem' }}>
                            <Printer size={18} color={statusColor} />
                            {p.identificadorUnico}
                          </div>
                        </div>
                        
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0 0 0.75rem 0' }}>
                          {p.marca} {p.modelo}
                        </p>
                        
                        {/* Botonera de Semáforo de Papel */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                           {/* Fila ATB */}
                           <div>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                               <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)' }}>Semáforo ATB</span>
                               <span style={{ 
                                 fontSize: '0.7rem', 
                                 fontWeight: 700, 
                                 padding: '0.15rem 0.4rem', 
                                 borderRadius: '8px', 
                                 background: estadoATB === 'VERDE' ? '#dcfce7' : estadoATB === 'NARANJA' ? '#fef3c7' : '#fee2e2',
                                 color: estadoATB === 'VERDE' ? '#15803d' : estadoATB === 'NARANJA' ? '#b45309' : '#b91c1c'
                               }}>
                                 {estadoATB === 'VERDE' ? 'Óptimo' : estadoATB === 'NARANJA' ? '10-20%' : 'Crítico'}
                               </span>
                             </div>
                             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.35rem' }}>
                               <button
                                 type="button"
                                 onClick={() => handleUpdateSemaforo(p.id, 'ATB', 100)}
                                 style={{
                                   padding: '0.3rem 0.2rem',
                                   fontSize: '0.7rem',
                                   fontWeight: 600,
                                   borderRadius: '6px',
                                   border: estadoATB === 'VERDE' ? '2px solid #10b981' : '1px solid #cbd5e1',
                                   background: estadoATB === 'VERDE' ? '#10b981' : '#ffffff',
                                   color: estadoATB === 'VERDE' ? '#ffffff' : '#475569',
                                   cursor: 'pointer',
                                   transition: 'all 0.2s ease'
                                 }}
                               >
                                 🟢 Óptimo
                               </button>
                               <button
                                 type="button"
                                 onClick={() => handleUpdateSemaforo(p.id, 'ATB', 15)}
                                 style={{
                                   padding: '0.3rem 0.2rem',
                                   fontSize: '0.7rem',
                                   fontWeight: 600,
                                   borderRadius: '6px',
                                   border: estadoATB === 'NARANJA' ? '2px solid #f59e0b' : '1px solid #cbd5e1',
                                   background: estadoATB === 'NARANJA' ? '#f59e0b' : '#ffffff',
                                   color: estadoATB === 'NARANJA' ? '#ffffff' : '#475569',
                                   cursor: 'pointer',
                                   transition: 'all 0.2s ease'
                                 }}
                               >
                                 🟠 10-20%
                               </button>
                               <button
                                 type="button"
                                 onClick={() => handleUpdateSemaforo(p.id, 'ATB', 5)}
                                 style={{
                                   padding: '0.3rem 0.2rem',
                                   fontSize: '0.7rem',
                                   fontWeight: 600,
                                   borderRadius: '6px',
                                   border: estadoATB === 'ROJO' ? '2px solid #ef4444' : '1px solid #cbd5e1',
                                   background: estadoATB === 'ROJO' ? '#ef4444' : '#ffffff',
                                   color: estadoATB === 'ROJO' ? '#ffffff' : '#475569',
                                   cursor: 'pointer',
                                   transition: 'all 0.2s ease'
                                 }}
                               >
                                 🔴 Crítico
                               </button>
                             </div>
                           </div>

                           {/* Fila BTP */}
                           <div>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                               <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)' }}>Semáforo BTP</span>
                               <span style={{ 
                                 fontSize: '0.7rem', 
                                 fontWeight: 700, 
                                 padding: '0.15rem 0.4rem', 
                                 borderRadius: '8px', 
                                 background: estadoBTP === 'VERDE' ? '#dcfce7' : estadoBTP === 'NARANJA' ? '#fef3c7' : '#fee2e2',
                                 color: estadoBTP === 'VERDE' ? '#15803d' : estadoBTP === 'NARANJA' ? '#b45309' : '#b91c1c'
                               }}>
                                 {estadoBTP === 'VERDE' ? 'Óptimo' : estadoBTP === 'NARANJA' ? '10-20%' : 'Crítico'}
                               </span>
                             </div>
                             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.35rem' }}>
                               <button
                                 type="button"
                                 onClick={() => handleUpdateSemaforo(p.id, 'BTP', 100)}
                                 style={{
                                   padding: '0.3rem 0.2rem',
                                   fontSize: '0.7rem',
                                   fontWeight: 600,
                                   borderRadius: '6px',
                                   border: estadoBTP === 'VERDE' ? '2px solid #10b981' : '1px solid #cbd5e1',
                                   background: estadoBTP === 'VERDE' ? '#10b981' : '#ffffff',
                                   color: estadoBTP === 'VERDE' ? '#ffffff' : '#475569',
                                   cursor: 'pointer',
                                   transition: 'all 0.2s ease'
                                 }}
                               >
                                 🟢 Óptimo
                               </button>
                               <button
                                 type="button"
                                 onClick={() => handleUpdateSemaforo(p.id, 'BTP', 15)}
                                 style={{
                                   padding: '0.3rem 0.2rem',
                                   fontSize: '0.7rem',
                                   fontWeight: 600,
                                   borderRadius: '6px',
                                   border: estadoBTP === 'NARANJA' ? '2px solid #f59e0b' : '1px solid #cbd5e1',
                                   background: estadoBTP === 'NARANJA' ? '#f59e0b' : '#ffffff',
                                   color: estadoBTP === 'NARANJA' ? '#ffffff' : '#475569',
                                   cursor: 'pointer',
                                   transition: 'all 0.2s ease'
                                 }}
                               >
                                 🟠 10-20%
                               </button>
                               <button
                                 type="button"
                                 onClick={() => handleUpdateSemaforo(p.id, 'BTP', 5)}
                                 style={{
                                   padding: '0.3rem 0.2rem',
                                   fontSize: '0.7rem',
                                   fontWeight: 600,
                                   borderRadius: '6px',
                                   border: estadoBTP === 'ROJO' ? '2px solid #ef4444' : '1px solid #cbd5e1',
                                   background: estadoBTP === 'ROJO' ? '#ef4444' : '#ffffff',
                                   color: estadoBTP === 'ROJO' ? '#ffffff' : '#475569',
                                   cursor: 'pointer',
                                   transition: 'all 0.2s ease'
                                 }}
                               >
                                 🔴 Crítico
                               </button>
                             </div>
                           </div>
                        </div>

                        {/* Botón de Intervención */}
                        <button 
                          className="btn btn-secondary w-full" 
                          style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.875rem', padding: '0.5rem' }}
                          onClick={() => handleOpenModal(p, area)}
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
              {modalError && (
                <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.875rem', border: '1px solid #fca5a5' }}>
                  <strong>Error:</strong> {modalError}
                </div>
              )}

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
                </select>
              </div>

              <div className="form-group">
                <label>Origen del Papel (Almacén) *</label>
                <select 
                  className="input-field" 
                  value={selectedAlmacen} 
                  onChange={e => setSelectedAlmacen(e.target.value)}
                  required
                >
                  {getAlmacenesCompatibles(selectedKiosko, selectedAreaOfKiosko).map(almacen => (
                    <option key={almacen.id} value={almacen.id}>
                      {almacen.nombre} ({almacen.ubicacion})
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '0.75rem', color: 'gray' }}>Bodega asignada según la Terminal del kiosko.</span>
              </div>

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
