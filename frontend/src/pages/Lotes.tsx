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
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text)' }}>
                      <Layers size={18} /> {lote.numeroLote}
                    </h3>
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{lote.tipoPapel.codigo} - {lote.tipoPapel.descripcion}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${status.bg} ${status.color}`}>
                      {status.icon}{status.label}
                    </span>
                  </div>
                </div>

                <div className="text-sm" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)' }}>
                    <Calendar size={14} /> 
                    <span>Recepción: {format(new Date(lote.fechaRecepcion), 'dd MMM yyyy', { locale: es })}</span>
                  </div>
                  {lote.fechaCaducidad && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)' }}>
                      <Calendar size={14} /> 
                      <span>Caducidad: {format(new Date(lote.fechaCaducidad), 'dd MMM yyyy', { locale: es })}</span>
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Package size={14} /> Stock Restante
                    </h4>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>{totalStock} / {lote.cantidadInicial || totalStock}</span>
                  </div>
                  
                  <div style={{ width: '100%', background: '#f1f5f9', borderRadius: '9999px', height: '8px', marginBottom: '1rem' }}>
                    <div style={{ width: `${percentRemaining}%`, background: 'var(--color-primary)', height: '8px', borderRadius: '9999px', transition: 'width 0.3s' }}></div>
                  </div>

                  {lote.stocks.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {lote.stocks.filter(s => s.cantidadActual > 0).map(s => (
                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', background: '#f8fafc', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                          <span style={{ color: 'var(--color-text-muted)' }}>{s.almacen.nombre}</span>
                          <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{s.cantidadActual}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic', margin: 0 }}>Lote agotado (sin stock).</p>
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
