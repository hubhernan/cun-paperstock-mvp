import React, { useEffect, useState } from 'react';
import { getLotes } from '../services/lotesService';
import { Layers, Calendar, Package, AlertCircle } from 'lucide-react';
import { format, isPast, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface StockAlmacen {
  id: string;
  cantidadActual: number;
  almacen: { nombre: string };
}

interface Lote {
  id: string;
  numeroLote: string;
  fechaRecepcion: string;
  fechaCaducidad: string | null;
  tipoPapel: { codigo: string; descripcion: string };
  stocks: StockAlmacen[];
}

const Lotes: React.FC = () => {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLotes = async () => {
      try {
        const res = await getLotes();
        if (res.success) {
          setLotes(res.data);
        }
      } catch (error) {
        console.error('Error fetching lotes', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLotes();
  }, []);

  const getStatusCaducidad = (fecha: string | null) => {
    if (!fecha) return { label: 'Sin caducidad', color: 'text-gray-400', icon: null };
    const date = new Date(fecha);
    if (isPast(date)) return { label: 'Caducado', color: 'text-red-500', icon: <AlertCircle size={14} className="inline mr-1" /> };
    if (isPast(addDays(date, -30))) return { label: 'Próximo a caducar', color: 'text-yellow-500', icon: <AlertCircle size={14} className="inline mr-1" /> };
    return { label: 'Vigente', color: 'text-green-500', icon: null };
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Gestión de Lotes (Trazabilidad)</h2>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', gridColumn: '1 / -1' }}>Cargando lotes...</div>
        ) : lotes.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', gridColumn: '1 / -1' }}>No hay lotes registrados.</div>
        ) : (
          lotes.map(lote => {
            const status = getStatusCaducidad(lote.fechaCaducidad);
            const totalStock = lote.stocks.reduce((acc, s) => acc + s.cantidadActual, 0);

            return (
              <div key={lote.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: totalStock === 0 ? '3px solid var(--color-gray-500)' : '3px solid var(--color-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Layers size={18} /> {lote.numeroLote}
                    </h3>
                    <span className="text-sm text-gray-400">{lote.tipoPapel.codigo} - {lote.tipoPapel.descripcion}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`text-xs font-bold px-2 py-1 rounded bg-gray-800 ${status.color}`}>
                      {status.icon}{status.label}
                    </span>
                  </div>
                </div>

                <div className="text-sm space-y-2">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar size={14} /> 
                    <span>Recepción: {format(new Date(lote.fechaRecepcion), 'dd MMM yyyy', { locale: es })}</span>
                  </div>
                  {lote.fechaCaducidad && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <Calendar size={14} /> 
                      <span>Caducidad: {format(new Date(lote.fechaCaducidad), 'dd MMM yyyy', { locale: es })}</span>
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-3 border-t border-gray-700">
                  <h4 className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                    <Package size={14} /> Stock Restante: {totalStock}
                  </h4>
                  {lote.stocks.length > 0 ? (
                    <div className="space-y-1">
                      {lote.stocks.filter(s => s.cantidadActual > 0).map(s => (
                        <div key={s.id} className="flex justify-between text-xs bg-gray-800 p-1.5 rounded">
                          <span>{s.almacen.nombre}</span>
                          <span className="font-bold text-white">{s.cantidadActual}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic m-0">Lote agotado (sin stock).</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Lotes;
