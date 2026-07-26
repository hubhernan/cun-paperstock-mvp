import React, { useState, useEffect } from 'react';
import { X, Clock, ArrowRight, ArrowDownRight, Package } from 'lucide-react';
import { getLoteHistorial } from '../services/lotesService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ModalTrazabilidadLoteProps {
  lote: any;
  onClose: () => void;
}

const ModalTrazabilidadLote: React.FC<ModalTrazabilidadLoteProps> = ({ lote, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [historial, setHistorial] = useState<any[]>([]);

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        const res = await getLoteHistorial(lote.id);
        if (res.success) {
          const { movimientos, asignaciones } = res.data;
          
          // Unificar en una sola línea de tiempo
          const combined = [
            ...movimientos.map((m: any) => ({
              ...m,
              tipo: 'movimiento',
              fechaSort: new Date(m.fechaMovimiento)
            })),
            ...asignaciones.map((a: any) => ({
              ...a,
              tipo: 'asignacion',
              fechaSort: new Date(a.fechaAsignacion)
            }))
          ];

          combined.sort((a, b) => b.fechaSort.getTime() - a.fechaSort.getTime());
          setHistorial(combined);
        }
      } catch (err) {
        console.error('Error fetching historial', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistorial();
  }, [lote.id]);

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <div>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} /> Trazabilidad del Lote
            </h2>
            <p className="text-gray-400 text-sm m-0 mt-1">{lote.numeroLote} - {lote.tipoPapel.codigo}</p>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0' }}>
          {loading ? (
            <div className="text-center p-4 text-gray-400">Cargando historial...</div>
          ) : historial.length === 0 ? (
            <div className="text-center p-4 text-gray-500 italic">No hay historial registrado para este lote.</div>
          ) : (
            <div className="relative pl-4 pr-2 space-y-4 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
              {historial.map((item, index) => {
                const isMovimiento = item.tipo === 'movimiento';
                const Icon = isMovimiento ? (item.tipoMovimiento === 'ENTRADA' ? ArrowDownRight : ArrowRight) : Package;
                const iconColor = isMovimiento 
                  ? (item.tipoMovimiento === 'ENTRADA' ? 'text-green-500' : (item.tipoMovimiento === 'TRANSFERENCIA' ? 'text-blue-500' : 'text-red-500'))
                  : 'text-purple-500';

                return (
                  <div key={item.id || index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border border-gray-600 bg-gray-800 text-slate-500 group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${iconColor}`}>
                      <Icon size={16} />
                    </div>
                    
                    <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] bg-gray-800 p-3 rounded shadow">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-bold text-sm ${iconColor}`}>
                          {isMovimiento ? item.tipoMovimiento : 'ASIGNACIÓN A KIOSKO'}
                        </span>
                        <time className="text-xs text-gray-400">
                          {format(item.fechaSort, 'dd/MM/yyyy HH:mm', { locale: es })}
                        </time>
                      </div>
                      
                      <div className="text-sm text-gray-300">
                        {isMovimiento ? (
                          <>
                            {item.tipoMovimiento === 'ENTRADA' && <p>Destino: <strong>{item.almacenDestino?.nombre}</strong></p>}
                            {item.tipoMovimiento === 'SALIDA' && <p>Origen: <strong>{item.almacenOrigen?.nombre}</strong></p>}
                            {item.tipoMovimiento === 'TRANSFERENCIA' && (
                              <p>{item.almacenOrigen?.nombre} &rarr; {item.almacenDestino?.nombre}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-400">Cant: {item.cantidad} • Por: {item.usuario?.nombre}</p>
                          </>
                        ) : (
                          <>
                            <p>Kiosko: <strong>{item.periferico?.identificadorUnico}</strong> ({item.periferico?.area?.nombre})</p>
                            <p className="mt-1 text-xs text-gray-400">Cant: {item.cantidadAsignada} • Por: {item.usuario?.nombre}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalTrazabilidadLote;
