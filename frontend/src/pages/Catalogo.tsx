import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';

interface TipoPapel {
  id: string;
  codigo: string;
  descripcion: string;
  unidadMedida: string;
  stockMinimo: number;
}

const Catalogo: React.FC = () => {
  const [tipos, setTipos] = useState<TipoPapel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTipos = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/tipos-papel');
        if (response.data.success) {
          setTipos(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching catalog', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTipos();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Catálogo de Papel</h2>
        <button className="btn btn-primary">
          <Plus size={18} />
          Nuevo Tipo
        </button>
      </div>

      <div className="card table-container" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descripción</th>
                <th>Unidad</th>
                <th>Stock Mínimo</th>
              </tr>
            </thead>
            <tbody>
              {tipos.map((tipo) => (
                <tr key={tipo.id}>
                  <td style={{ fontWeight: 500 }}>{tipo.codigo}</td>
                  <td>{tipo.descripcion}</td>
                  <td>{tipo.unidadMedida}</td>
                  <td>{tipo.stockMinimo}</td>
                </tr>
              ))}
              {tipos.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center' }}>No hay registros.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Catalogo;
