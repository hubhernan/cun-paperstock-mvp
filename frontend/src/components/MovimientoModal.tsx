import React, { useState, useEffect } from 'react';
import { X, ScanLine, Keyboard, AlertCircle, CheckCircle2, Plus } from 'lucide-react';
import { useScanner } from '../hooks/useScanner';
import api from '../services/api';
import { getLotes, createLote } from '../services/lotesService';

interface MovimientoModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipoMovimiento: 'ENTRADA' | 'SALIDA' | 'TRANSFERENCIA';
  onSuccess: () => void;
}

const MovimientoModal: React.FC<MovimientoModalProps> = ({ isOpen, onClose, tipoMovimiento, onSuccess }) => {
  const [modoEscaner, setModoEscaner] = useState(true);
  const [almacenes, setAlmacenes] = useState<any[]>([]);
  const [tiposPapel, setTiposPapel] = useState<any[]>([]);
  const [lotes, setLotes] = useState<any[]>([]);
  
  // Form state
  const [almacenOrigenId, setAlmacenOrigenId] = useState('');
  const [almacenDestinoId, setAlmacenDestinoId] = useState('');
  const [tipoPapelId, setTipoPapelId] = useState('');
  const [loteId, setLoteId] = useState('');
  const [cantidad, setCantidad] = useState(1);
  
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
      setCantidad(1);
      setLoteId('');
      setCreandoLote(false);
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen]);

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
      if ((tipoMovimiento === 'SALIDA' || tipoMovimiento === 'TRANSFERENCIA') && !almacenOrigenId) throw new Error('Selecciona el almacén origen.');
      if (tipoMovimiento === 'TRANSFERENCIA' && !almacenDestinoId) throw new Error('Selecciona el almacén destino.');

      await api.post('/movimientos', {
        tipoMovimiento,
        tipoPapelId: papelId,
        loteId: tipoMovimiento === 'ENTRADA' ? loteId : null,
        almacenOrigenId: (tipoMovimiento === 'SALIDA' || tipoMovimiento === 'TRANSFERENCIA') ? almacenOrigenId : null,
        almacenDestinoId: (tipoMovimiento === 'ENTRADA' || tipoMovimiento === 'TRANSFERENCIA') ? almacenDestinoId : null,
        cantidad: cant,
        comentarios: modoEscaner ? 'Registrado vía escáner' : 'Registro manual'
      });

      const papel = tiposPapel.find(p => p.id === papelId);
      setSuccessMsg(`¡Registrado! ${cant} x ${papel?.codigo}`);
      onSuccess();
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccessMsg(''), 3000);

      // Si no es modo escáner, cerramos el modal
      if (!modoEscaner) {
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al registrar movimiento');
    } finally {
      setLoading(false);
    }
  };

  // Hook del escáner
  useScanner((codigo) => {
    if (!isOpen || !modoEscaner) return;
    
    const papel = tiposPapel.find(p => p.codigo === codigo);
    if (papel) {
      registrarMovimiento(papel.id, 1);
    } else {
      setError(`Código no reconocido: ${codigo}`);
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 m-0">
            {tipoMovimiento === 'ENTRADA' && <span className="text-green-400">▼ Nueva Entrada</span>}
            {tipoMovimiento === 'SALIDA' && <span className="text-yellow-400">▲ Nueva Salida</span>}
            {tipoMovimiento === 'TRANSFERENCIA' && <span className="text-blue-400">⇄ Transferencia</span>}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white bg-transparent border-none cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* Toggle Mode */}
          <div className="flex bg-gray-800 rounded-lg p-1 mb-6">
            <button 
              className={`flex-1 py-2 flex justify-center items-center gap-2 text-sm font-medium rounded-md transition-colors ${modoEscaner ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200 bg-transparent border-none cursor-pointer'}`}
              onClick={() => setModoEscaner(true)}
            >
              <ScanLine size={16} /> Escáner
            </button>
            <button 
              className={`flex-1 py-2 flex justify-center items-center gap-2 text-sm font-medium rounded-md transition-colors ${!modoEscaner ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200 bg-transparent border-none cursor-pointer'}`}
              onClick={() => setModoEscaner(false)}
            >
              <Keyboard size={16} /> Manual
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 text-red-300 rounded border border-red-500/30 flex items-center gap-2 text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-green-500/20 text-green-400 rounded border border-green-500/30 flex items-center gap-2 text-sm">
              <CheckCircle2 size={16} /> {successMsg}
            </div>
          )}

          <div className="space-y-4">
            {(tipoMovimiento === 'SALIDA' || tipoMovimiento === 'TRANSFERENCIA') && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Almacén Origen</label>
                <select className="input-field w-full" value={almacenOrigenId} onChange={e => setAlmacenOrigenId(e.target.value)}>
                  <option value="">Selecciona origen...</option>
                  {almacenes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </div>
            )}

            {(tipoMovimiento === 'ENTRADA' || tipoMovimiento === 'TRANSFERENCIA') && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Almacén Destino</label>
                <select className="input-field w-full" value={almacenDestinoId} onChange={e => setAlmacenDestinoId(e.target.value)}>
                  <option value="">Selecciona destino...</option>
                  {almacenes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </div>
            )}

            {tipoMovimiento === 'ENTRADA' && (
              <div className="bg-gray-800 p-3 rounded border border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-gray-300">Asignación de Lote</label>
                  {!creandoLote && (
                    <button onClick={() => setCreandoLote(true)} className="text-xs text-blue-400 hover:text-blue-300 bg-transparent border-none cursor-pointer flex items-center gap-1">
                      <Plus size={12} /> Nuevo Lote
                    </button>
                  )}
                </div>
                
                {creandoLote ? (
                  <div className="space-y-2 mt-2">
                    <select className="input-field w-full text-sm" value={tipoPapelId} onChange={e => setTipoPapelId(e.target.value)}>
                      <option value="">1. Selecciona Papel...</option>
                      {tiposPapel.map(p => <option key={p.id} value={p.id}>{p.codigo}</option>)}
                    </select>
                    <input type="text" placeholder="2. Número de Lote (ej. LOTE-123)" className="input-field w-full text-sm" value={nuevoLoteNum} onChange={e => setNuevoLoteNum(e.target.value)} />
                    <input type="date" className="input-field w-full text-sm" value={nuevoLoteCad} onChange={e => setNuevoLoteCad(e.target.value)} title="Fecha de Caducidad (Opcional)" />
                    <div className="flex gap-2 mt-2">
                      <button className="btn btn-primary flex-1 text-xs py-1" onClick={handleCrearLote} disabled={loading}>Guardar Lote</button>
                      <button className="btn bg-gray-600 hover:bg-gray-500 flex-1 text-xs py-1" onClick={() => setCreandoLote(false)}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <select className="input-field w-full" value={loteId} onChange={e => {
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

            {modoEscaner ? (
              <div className="mt-6 border-2 border-dashed border-blue-500/50 rounded-xl p-8 text-center bg-blue-500/5">
                <ScanLine size={48} className="mx-auto text-blue-400 mb-3 animate-pulse" />
                <p className="text-gray-300 font-medium m-0">Escáner Activo</p>
                <p className="text-xs text-gray-500 mt-2">Escanea un código para registrar 1 unidad automáticamente.</p>
                {/* Input oculto para móviles o enfoques forzados */}
                <input 
                  type="text" 
                  className="opacity-0 absolute" 
                  autoFocus 
                  onBlur={(e) => e.target.focus()} 
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Tipo de Papel</label>
                  <select className="input-field w-full" value={tipoPapelId} onChange={e => setTipoPapelId(e.target.value)}>
                    <option value="">Selecciona papel...</option>
                    {tiposPapel.map(p => <option key={p.id} value={p.id}>{p.codigo} - {p.descripcion}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Cantidad</label>
                  <input type="number" min="1" className="input-field w-full" value={cantidad} onChange={e => setCantidad(Number(e.target.value))} />
                </div>
                <button 
                  className="btn btn-primary w-full mt-4 flex justify-center items-center gap-2"
                  onClick={() => registrarMovimiento(tipoPapelId)}
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar Movimiento'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovimientoModal;
