import React, { useState, useEffect } from 'react';
import { X, Layers } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { createLote } from '../services/lotesService';

interface ModalRegistroLoteProps {
  onClose: () => void;
  onLoteCreado: () => void;
}

const ModalRegistroLote: React.FC<ModalRegistroLoteProps> = ({ onClose, onLoteCreado }) => {
  const { user } = useAuth();
  const [tiposPapel, setTiposPapel] = useState<any[]>([]);
  const [almacenes, setAlmacenes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    tipoPapelId: '',
    numeroLote: '',
    fechaRecepcion: new Date().toISOString().split('T')[0],
    fechaCaducidad: '',
    almacenId: '',
    cantidad: ''
  });

  useEffect(() => {
    const fetchSelectData = async () => {
      try {
        const [resTipos, resAlmacenes] = await Promise.all([
          api.get('/tipos-papel'),
          api.get('/almacenes')
        ]);
        setTiposPapel(resTipos.data.data || []);
        setAlmacenes(resAlmacenes.data.data || []);
      } catch (err) {
        console.error('Error fetching data for lote', err);
      }
    };
    fetchSelectData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.tipoPapelId || !formData.numeroLote || !formData.almacenId || !formData.cantidad) {
      setError('Por favor completa todos los campos requeridos.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        tipoPapelId: formData.tipoPapelId,
        numeroLote: formData.numeroLote,
        fechaRecepcion: formData.fechaRecepcion || undefined,
        fechaCaducidad: formData.fechaCaducidad || undefined,
        almacenId: formData.almacenId,
        cantidad: parseInt(formData.cantidad, 10),
        usuarioId: user?.id
      };
      
      const res = await createLote(payload);
      if (res.success) {
        onLoteCreado();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al registrar el lote');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px', padding: '2rem' }}>
        <div className="modal-header" style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', color: 'var(--color-primary)' }}>
            <Layers size={24} /> Registrar Nuevo Lote
          </h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label className="form-label" style={{ fontWeight: 600, color: 'var(--color-text-heading)' }}>Tipo de Papel *</label>
            <select name="tipoPapelId" value={formData.tipoPapelId} onChange={handleChange} className="form-input" required>
              <option value="">Selecciona papel...</option>
              {tiposPapel.map(tp => (
                <option key={tp.id} value={tp.id}>{tp.codigo} - {tp.descripcion}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 600, color: 'var(--color-text-heading)' }}>Número de Lote *</label>
            <input 
              type="text" 
              name="numeroLote" 
              value={formData.numeroLote} 
              onChange={handleChange} 
              className="form-input" 
              placeholder="Ej. LOTE-2026-002"
              required 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--color-text-heading)' }}>Fecha Recepción</label>
              <input type="date" name="fechaRecepcion" value={formData.fechaRecepcion} onChange={handleChange} className="form-input" />
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--color-text-heading)' }}>Fecha Caducidad</label>
              <input type="date" name="fechaCaducidad" value={formData.fechaCaducidad} onChange={handleChange} className="form-input" />
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '0.5rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-heading)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Asignación Inicial de Inventario
            </h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--color-text-heading)' }}>Almacén Destino *</label>
              <select name="almacenId" value={formData.almacenId} onChange={handleChange} className="form-input" required>
                <option value="">Selecciona destino...</option>
                {almacenes.map(a => (
                  <option key={a.id} value={a.id}>{a.nombre} - {a.ubicacion}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--color-text-heading)' }}>Cantidad Inicial (Cajas/Rollos) *</label>
              <input 
                type="number" 
                name="cantidad" 
                value={formData.cantidad} 
                onChange={handleChange} 
                className="form-input" 
                min="1"
                required 
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem', fontSize: '1rem' }} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Lote'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ModalRegistroLote;
