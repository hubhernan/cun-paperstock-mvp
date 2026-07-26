import React, { useEffect, useState, useMemo } from 'react';
import { getLotes } from '../services/lotesService';
import { Layers, Calendar, Package, AlertCircle, Plus, Search, Filter } from 'lucide-react';
import { format, isPast, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import ModalRegistroLote from '../components/ModalRegistroLote';
import ModalTrazabilidadLote from '../components/ModalTrazabilidadLote';

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
  cantidadInicial: number;
}

const Lotes: React.FC = () => {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegistroModal, setShowRegistroModal] = useState(false);
  const [selectedLote, setSelectedLote] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState('Todos');

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

  useEffect(() => {
    fetchLotes();
  }, []);

  const getStatusCaducidad = (fecha: string | null, totalStock: number) => {
    if (totalStock === 0) return { label: 'Agotado', color: 'text-gray-400', bg: 'bg-gray-800', icon: null };
    if (!fecha) return { label: 'Sin caducidad', color: 'text-gray-400', bg: 'bg-gray-800', icon: null };
    const date = new Date(fecha);
    if (isPast(date)) return { label: 'Caducado', color: 'text-red-300', bg: 'bg-red-900/50', icon: <AlertCircle size={14} className="inline mr-1" /> };
    if (isPast(addDays(date, -30))) return { label: 'Próximo', color: 'text-yellow-300', bg: 'bg-yellow-900/50', icon: <AlertCircle size={14} className="inline mr-1" /> };
    return { label: 'Vigente', color: 'text-green-400', bg: 'bg-green-900/50', icon: null };
  };

  const lotesFiltrados = useMemo(() => {
    return lotes.filter(lote => {
      const matchSearch = lote.numeroLote.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          lote.tipoPapel.codigo.toLowerCase().includes(searchQuery.toLowerCase());
      
      const totalStock = lote.stocks.reduce((acc, s) => acc + s.cantidadActual, 0);
      const status = getStatusCaducidad(lote.fechaCaducidad, totalStock).label;
      
      const matchStatus = filterEstado === 'Todos' || status === filterEstado || (filterEstado === 'Vigente' && status === 'Sin caducidad');
      
      return matchSearch && matchStatus;
    });
  }, [lotes, searchQuery, filterEstado]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2>Gestión de Lotes (Trazabilidad)</h2>
        <button className="btn btn-primary flex items-center gap-2" onClick={() => setShowRegistroModal(true)}>
          <Plus size={20} /> Registrar Lote
        </button>
      </div>

      <div className="card mb-6" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="flex-1 min-w-[250px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por lote o código de papel..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field w-full pl-10"
            />
          </div>
        </div>
        <div className="min-w-[200px] flex items-center gap-2">
          <Filter size={18} className="text-gray-400" />
          <select 
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="input-field w-full"
          >
            <option value="Todos">Todos los Estados</option>
            <option value="Vigente">Vigentes</option>
            <option value="Próximo">Próximos a caducar</option>
            <option value="Caducado">Caducados</option>
            <option value="Agotado">Agotados</option>
          </select>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', gridColumn: '1 / -1' }}>Cargando lotes...</div>
        ) : lotesFiltrados.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', gridColumn: '1 / -1' }}>No se encontraron lotes.</div>
        ) : (
          lotesFiltrados.map(lote => {
            const totalStock = lote.stocks.reduce((acc, s) => acc + s.cantidadActual, 0);
            const status = getStatusCaducidad(lote.fechaCaducidad, totalStock);
            const cantidadInicial = lote.cantidadInicial || totalStock || 1; // Fallback to avoid div by zero
            const percentRemaining = Math.min(100, Math.round((totalStock / cantidadInicial) * 100));

            return (
              <div 
                key={lote.id} 
                className="card cursor-pointer hover:border-blue-500 transition-colors" 
                onClick={() => setSelectedLote(lote)}
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '1rem', 
                  borderTop: totalStock === 0 ? '3px solid var(--color-gray-500)' : '3px solid var(--color-primary)' 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Layers size={18} /> {lote.numeroLote}
                    </h3>
                    <span className="text-sm text-gray-400">{lote.tipoPapel.codigo} - {lote.tipoPapel.descripcion}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${status.bg} ${status.color}`}>
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
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-sm text-gray-400 m-0 flex items-center gap-2">
                      <Package size={14} /> Stock Restante
                    </h4>
                    <span className="text-sm font-bold">{totalStock} / {lote.cantidadInicial || totalStock}</span>
                  </div>
                  
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                    <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${percentRemaining}%` }}></div>
                  </div>

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

      {showRegistroModal && (
        <ModalRegistroLote 
          onClose={() => setShowRegistroModal(false)}
          onLoteCreado={() => {
            setShowRegistroModal(false);
            fetchLotes();
          }}
        />
      )}

      {selectedLote && (
        <ModalTrazabilidadLote 
          lote={selectedLote}
          onClose={() => setSelectedLote(null)}
        />
      )}
    </div>
  );
};

export default Lotes;
