import React, { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import api from '../services/api';

interface TipoPapel {
  id: string;
  codigo: string;
  descripcion: string;
  unidadMedida: string;
  stockMinimo: number;
  proveedor: string;
  costoUnitario: number;
  rendimientoEstimado: number | null;
}

const Catalogo: React.FC = () => {
  const [tipos, setTipos] = useState<TipoPapel[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    codigo: '',
    descripcion: '',
    proveedor: '',
    costoUnitario: '',
    unidadMedida: 'Rollo',
    stockMinimo: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchTipos = async () => {
      try {
        const response = await api.get('/tipos-papel');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        costoUnitario: Number(formData.costoUnitario),
        stockMinimo: Number(formData.stockMinimo)
      };
      const response = await api.post('/tipos-papel', payload);
      if (response.data.success) {
        setTipos([...tipos, response.data.data]);
        setIsModalOpen(false);
        setFormData({ codigo: '', descripcion: '', proveedor: '', costoUnitario: '', unidadMedida: 'Rollo', stockMinimo: '' });
      }
    } catch (error) {
      console.error('Error creating type', error);
      alert('Error al crear tipo de papel');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Catálogo de Papel</h2>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
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
                <th>Proveedor</th>
                <th>Costo Unit.</th>
                <th>Rendimiento (Impresiones)</th>
                <th>Unidad</th>
                <th>Stock Mínimo</th>
              </tr>
            </thead>
            <tbody>
              {tipos.map((tipo) => (
                <tr key={tipo.id}>
                  <td style={{ fontWeight: 500 }}>{tipo.codigo}</td>
                  <td>{tipo.descripcion}</td>
                  <td>{tipo.proveedor || 'N/A'}</td>
                  <td>${tipo.costoUnitario?.toString()}</td>
                  <td>{tipo.rendimientoEstimado ? `${tipo.rendimientoEstimado} docs` : 'N/A'}</td>
                  <td>{tipo.unidadMedida}</td>
                  <td>{tipo.stockMinimo}</td>
                </tr>
              ))}
              {tipos.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center' }}>No hay registros.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 style={{ margin: 0 }}>Nuevo Tipo de Papel</h2>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}><X /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Código *</label>
                <input required className="input-field" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} placeholder="Ej. ATB-02" />
              </div>
              <div className="form-group">
                <label>Descripción *</label>
                <input required className="input-field" value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} placeholder="Pases de abordar..." />
              </div>
              <div className="form-group">
                <label>Proveedor</label>
                <input className="input-field" value={formData.proveedor} onChange={e => setFormData({...formData, proveedor: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Costo Unitario ($) *</label>
                  <input required type="number" step="0.01" className="input-field" value={formData.costoUnitario} onChange={e => setFormData({...formData, costoUnitario: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Unidad de Medida *</label>
                  <select required className="input-field" value={formData.unidadMedida} onChange={e => setFormData({...formData, unidadMedida: e.target.value})}>
                    <option value="Rollo">Rollo</option>
                    <option value="Caja">Caja</option>
                    <option value="Paquete">Paquete</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Stock Mínimo (Alerta) *</label>
                <input required type="number" className="input-field" value={formData.stockMinimo} onChange={e => setFormData({...formData, stockMinimo: e.target.value})} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : 'Guardar Tipo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Catalogo;
