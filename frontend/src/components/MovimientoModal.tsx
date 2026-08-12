import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

interface MovimientoModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipoMovimiento: 'ENTRADA' | 'TRANSFERENCIA' | 'MERMA';
  onSuccess: () => void;
}

const MovimientoModal: React.FC<MovimientoModalProps> = ({ isOpen, onClose, tipoMovimiento, onSuccess }) => {
  const [almacenes, setAlmacenes] = useState<any[]>([]);
  const [tiposPapel, setTiposPapel] = useState<any[]>([]);
  
  // Form state
  const [almacenOrigenId, setAlmacenOrigenId] = useState('');
  const [almacenDestinoId, setAlmacenDestinoId] = useState('');
  const [tipoPapelId, setTipoPapelId] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [comentarios, setComentarios] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [resAlm, resPapel] = await Promise.all([
            api.get('/almacenes'),
            api.get('/tipos-papel')
          ]);
          setAlmacenes(resAlm.data.data);
          setTiposPapel(resPapel.data.data);
        } catch (err) {
          console.error(err);
        }
      };
      fetchData();
      // Reset form
      setAlmacenOrigenId('');
      setAlmacenDestinoId('');
      setTipoPapelId('');
      setCantidad(1);
      setComentarios('');
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen, tipoMovimiento]);

  const registrarMovimiento = async (papelId: string, cant: number = cantidad) => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    
    try {
      if (!papelId) throw new Error('Selecciona el tipo de papel.');
      if (tipoMovimiento === 'ENTRADA' && !almacenDestinoId) throw new Error('Selecciona el almacén destino.');
      if ((tipoMovimiento === 'TRANSFERENCIA' || tipoMovimiento === 'MERMA') && !almacenOrigenId) throw new Error('Selecciona el almacén origen.');
      if (tipoMovimiento === 'TRANSFERENCIA' && !almacenDestinoId) throw new Error('Selecciona el almacén destino.');

      await api.post('/movimientos', {
        tipoMovimiento,
        tipoPapelId: papelId,
        loteId: null,
        almacenOrigenId: (tipoMovimiento === 'TRANSFERENCIA' || tipoMovimiento === 'MERMA') ? almacenOrigenId : null,
        almacenDestinoId: (tipoMovimiento === 'ENTRADA' || tipoMovimiento === 'TRANSFERENCIA') ? almacenDestinoId : null,
        cantidad: cant,
        comentarios: comentarios || 'Registro manual'
      });

      const papel = tiposPapel.find(p => p.id === papelId);
      setSuccessMsg(`¡Registrado! ${cant} x ${papel?.codigo}`);
      onSuccess();
      
      setTimeout(() => setSuccessMsg(''), 3000);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al registrar movimiento');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        
        {/* Header */}
        <div className="modal-header">
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {tipoMovimiento === 'ENTRADA' && <span style={{ color: 'var(--color-success)' }}>▼ Nueva Entrada</span>}
            {tipoMovimiento === 'TRANSFERENCIA' && <span style={{ color: 'var(--color-primary-light)' }}>⇄ Transferencia</span>}
            {tipoMovimiento === 'MERMA' && <span style={{ color: 'var(--color-danger)' }}>⚠ Nueva Merma</span>}
          </h3>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div>
          {error && (
            <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '4px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {successMsg && (
            <div style={{ padding: '0.75rem', backgroundColor: '#d1fae5', color: '#047857', borderRadius: '4px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
              <CheckCircle2 size={16} /> {successMsg}
            </div>
          )}

          <div>
            {(tipoMovimiento === 'TRANSFERENCIA' || tipoMovimiento === 'MERMA') && (
              <div className="form-group">
                <label className="form-label">Almacén Origen</label>
                <select className="form-input" value={almacenOrigenId} onChange={e => setAlmacenOrigenId(e.target.value)}>
                  <option value="">Selecciona origen...</option>
                  {almacenes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </div>
            )}

            {(tipoMovimiento === 'ENTRADA' || tipoMovimiento === 'TRANSFERENCIA') && (
              <div className="form-group">
                <label className="form-label">Almacén Destino</label>
                <select className="form-input" value={almacenDestinoId} onChange={e => setAlmacenDestinoId(e.target.value)}>
                  <option value="">Selecciona destino...</option>
                  {almacenes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Tipo de Papel</label>
              <select className="form-input" value={tipoPapelId} onChange={e => setTipoPapelId(e.target.value)}>
                <option value="">Selecciona papel...</option>
                {tiposPapel.map(p => <option key={p.id} value={p.id}>{p.codigo} - {p.descripcion}</option>)}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Cantidad</label>
              <input type="number" min="1" className="form-input" value={cantidad} onChange={e => setCantidad(Number(e.target.value))} />
            </div>

            <div className="form-group">
              <label className="form-label">Razón del Movimiento / Comentarios</label>
              <textarea 
                className="form-input" 
                rows={3} 
                placeholder={tipoMovimiento === 'MERMA' ? 'Ej. Rollos mojados por gotera, dañados en transporte, etc.' : 'Indica comentarios adicionales...'} 
                value={comentarios} 
                onChange={e => setComentarios(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>
            
            <button 
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1rem', display: 'flex', justifyContent: 'center' }}
              onClick={() => registrarMovimiento(tipoPapelId)}
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar Movimiento'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovimientoModal;
