import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Map, Printer, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

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
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {area.perifericos.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>Sin periféricos asignados</p>
                ) : (
                  area.perifericos.map(p => (
                    <div key={p.id} style={{ border: '1px solid #e2e8f0', borderRadius: 'var(--border-radius)', padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                          <Printer size={16} />
                          {p.identificadorUnico}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                          {getStatusIcon(p.estadoOperativo)}
                          {p.estadoOperativo}
                        </div>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: '0 0 0.5rem 0' }}>
                        {p.marca} {p.modelo}
                      </p>
                      
                      {p.tiposCompatibles && p.tiposCompatibles.length > 0 && (
                        <div style={{ fontSize: '0.75rem' }}>
                          <strong>Compatibilidad:</strong>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                            {p.tiposCompatibles.map(tc => (
                              <span key={tc.tipoPapel.codigo} style={{ background: '#f1f5f9', padding: '0.125rem 0.5rem', borderRadius: '1rem', color: 'var(--color-secondary)' }}>
                                {tc.tipoPapel.codigo}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Areas;
