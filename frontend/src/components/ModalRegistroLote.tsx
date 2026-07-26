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
        setTiposPapel(resTipos.data);
        setAlmacenes(resAlmacenes.data);
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
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={20} /> Registrar Nuevo Lote
          </h2>
          <button className="icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && <div className="bg-red-500/20 text-red-300 p-3 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Tipo de Papel *</label>
            <select name="tipoPapelId" value={formData.tipoPapelId} onChange={handleChange} className="input-field w-full" required>
              <option value="">Selecciona un tipo...</option>
              {tiposPapel.map(tp => (
                <option key={tp.id} value={tp.id}>{tp.codigo} - {tp.descripcion}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Número de Lote *</label>
            <input 
              type="text" 
              name="numeroLote" 
              value={formData.numeroLote} 
              onChange={handleChange} 
              className="input-field w-full" 
              placeholder="Ej. LOTE-2026-002"
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Fecha Recepción</label>
              <input type="date" name="fechaRecepcion" value={formData.fechaRecepcion} onChange={handleChange} className="input-field w-full" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Fecha Caducidad</label>
              <input type="date" name="fechaCaducidad" value={formData.fechaCaducidad} onChange={handleChange} className="input-field w-full" />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-700">
            <h3 className="text-sm font-bold text-white mb-3">Asignación Inicial de Inventario</h3>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Almacén Destino *</label>
              <select name="almacenId" value={formData.almacenId} onChange={handleChange} className="input-field w-full" required>
                <option value="">Selecciona un almacén...</option>
                {almacenes.map(a => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </div>

            <div className="mt-3">
              <label className="block text-sm text-gray-400 mb-1">Cantidad Inicial (Cajas/Rollos) *</label>
              <input 
                type="number" 
                name="cantidad" 
                value={formData.cantidad} 
                onChange={handleChange} 
                className="input-field w-full" 
                min="1"
                required 
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar Lote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalRegistroLote;
