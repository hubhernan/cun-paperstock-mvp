import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle2, Plus } from 'lucide-react';
import api from '../services/api';
import { getLotes, createLote } from '../services/lotesService';

interface MovimientoModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipoMovimiento: 'ENTRADA' | 'SALIDA' | 'TRANSFERENCIA' | 'MERMA';
  onSuccess: () => void;
}

const MovimientoModal: React.FC<MovimientoModalProps> = ({ isOpen, onClose, tipoMovimiento, onSuccess }) => {
  const [almacenes, setAlmacenes] = useState<any[]>([]);
  const [tiposPapel, setTiposPapel] = useState<any[]>([]);
  const [lotes, setLotes] = useState<any[]>([]);
  
  // Form state
  const [almacenOrigenId, setAlmacenOrigenId] = useState('');
  const [almacenDestinoId, setAlmacenDestinoId] = useState('');
  const [tipoPapelId, setTipoPapelId] = useState('');
  const [loteId, setLoteId] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [comentarios, setComentarios] = useState('');
  
  // Nuevo Lote state
  const [creandoLote, setCreandoLote] = useState(false);
  const [nuevoLoteNum, setNuevoLoteNum] = useState('');
  const [nuevoLoteCad, setNuevoLoteCad] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [resAlm, resPapel, resLotes] = await Promise.all([
            api.get('/almacenes'),
            api.get('/tipos-papel'),
            getLotes()
          ]);
          setAlmacenes(resAlm.data.data);
          setTiposPapel(resPapel.data.data);
          setLotes(resLotes.data || []);
        } catch (err) {
          console.error(err);
        }
      };
      fetchData();
      // Reset form
      setAlmacenOrigenId('');
      setAlmacenDestinoId('');
      setCantidad(1);
      setLoteId('');
      setComentarios('');
      setCreandoLote(false);
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen, tipoMovimiento]);

  const handleCrearLote = async () => {
    if (!tipoPapelId || !nuevoLoteNum) {
      setError('Debes seleccionar el tipo de papel y un número de lote.');
      return;
    }
    setLoading(true);
    try {
      const res = await createLote({ tipoPapelId, numeroLote: nuevoLoteNum, fechaCaducidad: nuevoLoteCad });
      if (res.success) {
        setLotes([res.data, ...lotes]);
        setLoteId(res.data.id);
        setCreandoLote(false);
        setSuccessMsg('Lote creado correctamente.');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err: any) {
      setError('Error al crear lote.');
    } finally {
      setLoading(false);
    }
  };

  const registrarMovimiento = async (papelId: string, cant: number = cantidad) => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    
    try {
      if (tipoMovimiento === 'ENTRADA' && !almacenDestinoId) throw new Error('Selecciona el almacén destino.');
      if (tipoMovimiento === 'ENTRADA' && !loteId) throw new Error('Debes seleccionar o crear un lote para la Entrada.');
      if ((tipoMovimiento === 'SALIDA' || tipoMovimiento === 'TRANSFERENCIA' || tipoMovimiento === 'MERMA') && !almacenOrigenId) throw new Error('Selecciona el almacén origen.');
      if (tipoMovimiento === 'TRANSFERENCIA' && !almacenDestinoId) throw new Error('Selecciona el almacén destino.');

      await api.post('/movimientos', {
        tipoMovimiento,
        tipoPapelId: papelId,
        loteId: tipoMovimiento === 'ENTRADA' ? loteId : null,
        almacenOrigenId: (tipoMovimiento === 'SALIDA' || tipoMovimiento === 'TRANSFERENCIA' || tipoMovimiento === 'MERMA') ? almacenOrigenId : null,
        almacenDestinoId: (tipoMovimiento === 'ENTRADA' || tipoMovimiento === 'TRANSFERENCIA') ? almacenDestinoId : null,
        cantidad: cant,
        comentarios: comentarios || 'Registro manual'
      });

      const papel = tiposPapel.find(p => p.id === papelId);
      setSuccessMsg(`¡Registrado! ${cant} x ${papel?.codigo}`);
      onSuccess();
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccessMsg(''), 3000);

      // Cerramos el modal
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
            {tipoMovimiento === 'SALIDA' && <span style={{ color: 'var(--color-warning)' }}>▲ Nueva Salida</span>}
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
            {(tipoMovimiento === 'SALIDA' || tipoMovimiento === 'TRANSFERENCIA' || tipoMovimiento === 'MERMA') && (
              <div className="form-group">
                <label className="form-label">Almacén Origen</label>
                <select className="form-input" value={almacenOrigenId} onChange={e => setAlmacenOrigenId(e.target.value)}>
                  <option value="">Selecciona origen...</option>
                  {almacenes.map(a => <option key={a.id} value={a.id}>{a.nombre} {a.ubicacion ? `- ${a.ubicacion}` : ''}</option>)}
                </select>
              </div>
            )}

            {(tipoMovimiento === 'ENTRADA' || tipoMovimiento === 'TRANSFERENCIA') && (
              <div className="form-group">
                <label className="form-label">Almacén Destino</label>
                <select className="form-input" value={almacenDestinoId} onChange={e => setAlmacenDestinoId(e.target.value)}>
                  <option value="">Selecciona destino...</option>
                  {almacenes.map(a => <option key={a.id} value={a.id}>{a.nombre} {a.ubicacion ? `- ${a.ubicacion}` : ''}</option>)}
                </select>
              </div>
            )}

            {tipoMovimiento === 'ENTRADA' && (
              <div style={{ backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Asignación de Lote</label>
                  {!creandoLote && (
                    <button onClick={() => setCreandoLote(true)} style={{ background: 'none', border: 'none', color: 'var(--color-primary-light)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                      <Plus size={12} /> Nuevo Lote
                    </button>
                  )}
                </div>
                
                {creandoLote ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <select className="form-input" value={tipoPapelId} onChange={e => setTipoPapelId(e.target.value)}>
                      <option value="">1. Selecciona Papel...</option>
                      {tiposPapel.map(p => <option key={p.id} value={p.id}>{p.codigo}</option>)}
                    </select>
                    <input type="text" placeholder="2. Número de Lote (ej. LOTE-123)" className="form-input" value={nuevoLoteNum} onChange={e => setNuevoLoteNum(e.target.value)} />
                    <input type="date" className="form-input" value={nuevoLoteCad} onChange={e => setNuevoLoteCad(e.target.value)} title="Fecha de Caducidad (Opcional)" />
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button className="btn btn-primary" style={{ flex: 1, padding: '0.25rem' }} onClick={handleCrearLote} disabled={loading}>Guardar Lote</button>
                      <button className="btn" style={{ flex: 1, padding: '0.25rem', backgroundColor: '#94a3b8', color: 'white' }} onClick={() => setCreandoLote(false)}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <select className="form-input" value={loteId} onChange={e => {
                    setLoteId(e.target.value);
                    const selectedLote = lotes.find(l => l.id === e.target.value);
                    if (selectedLote) setTipoPapelId(selectedLote.tipoPapelId);
                  }}>
                    <option value="">Selecciona un lote existente...</option>
                    {lotes.map(l => <option key={l.id} value={l.id}>{l.numeroLote} ({l.tipoPapel.codigo})</option>)}
                  </select>
                )}
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
