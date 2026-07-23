import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, MapPin } from 'lucide-react';

interface Almacen {
  id: string;
  nombre: string;
  ubicacion: string;
  capacidad: string;
  proveedor?: string;
}

const Almacenes: React.FC = () => {
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlmacenes = async () => {
      try {
        const response = await axios.get((import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/almacenes');
        if (response.data.success) {
          setAlmacenes(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching almacenes', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAlmacenes();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Gestión de Almacenes</h2>
        <button className="btn btn-primary">
          <Plus size={18} />
          Nuevo Almacén
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {loading ? (
          <div>Cargando...</div>
        ) : almacenes.length === 0 ? (
          <div className="card w-full">No hay almacenes registrados.</div>
        ) : (
          almacenes.map(almacen => (
            <div key={almacen.id} className="card relative" style={{ display: 'flex', flexDirection: 'column', height: '100%', borderTop: almacen.proveedor === 'SITA' ? '3px solid #3b82f6' : (almacen.proveedor === 'ASUR' ? '3px solid #10b981' : '3px solid var(--color-primary)') }}>
              {almacen.proveedor && (
                <div className={`absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded ${almacen.proveedor === 'SITA' ? 'bg-blue-900/50 text-blue-400 border border-blue-700/50' : (almacen.proveedor === 'ASUR' ? 'bg-green-900/50 text-green-400 border border-green-700/50' : 'bg-gray-800/50 text-gray-300 border border-gray-600/50')}`}>
                  {almacen.proveedor}
                </div>
              )}
              <h3 style={{ margin: '0 0 0.5rem 0', paddingRight: '4rem' }}>{almacen.nombre}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                <MapPin size={16} />
                {almacen.ubicacion}
              </div>
              <div style={{ marginTop: 'auto' }}>
                <p style={{ margin: 0, fontSize: '0.875rem' }}><strong>Capacidad:</strong> {almacen.capacidad || 'N/A'}</p>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', background: 'var(--color-secondary)' }}>
                  Ver Stock
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Almacenes;
