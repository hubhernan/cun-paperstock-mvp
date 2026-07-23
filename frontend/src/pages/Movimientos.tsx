import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowRightLeft, ArrowDownToLine, ArrowUpFromLine, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import MovimientoModal from '../components/MovimientoModal';

interface Movimiento {
  id: string;
  tipoMovimiento: string;
  cantidad: number;
  fechaMovimiento: string;
  comentarios: string;
  tipoPapel: { codigo: string; descripcion: string };
  almacenOrigen: { nombre: string; proveedor?: string } | null;
  almacenDestino: { nombre: string; proveedor?: string } | null;
  usuario: { nombre: string };
}

const Movimientos: React.FC = () => {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTipo, setModalTipo] = useState<'ENTRADA' | 'SALIDA' | 'TRANSFERENCIA'>('ENTRADA');
  const [filtroProveedor, setFiltroProveedor] = useState<string>('ALL');

  const fetchMovimientos = async () => {
      try {
        const response = await axios.get((import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/movimientos');
        if (response.data.success) {
          setMovimientos(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching movimientos', error);
      } finally {
        setLoading(false);
      }
    };
  
  useEffect(() => {
    fetchMovimientos();
  }, []);

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'ENTRADA': return <ArrowDownToLine size={18} color="var(--color-success)" />;
      case 'SALIDA': return <ArrowUpFromLine size={18} color="var(--color-warning)" />;
      case 'MERMA': return <AlertTriangle size={18} color="var(--color-danger)" />;
      case 'TRANSFERENCIA': return <ArrowRightLeft size={18} color="var(--color-primary-light)" />;
      default: return null;
    }
  };

  const exportToCSV = () => {
    const headers = ['Tipo', 'Papel', 'Origen', 'Destino', 'Cantidad', 'Fecha', 'Usuario'];
    const rows = movimientos.map(mov => [
      mov.tipoMovimiento,
      mov.tipoPapel.codigo,
      mov.almacenOrigen?.nombre || '',
      mov.almacenDestino?.nombre || '',
      mov.cantidad,
      format(new Date(mov.fechaMovimiento), 'dd/MM/yyyy HH:mm'),
      mov.usuario.nombre
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "movimientos_cun.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredMovimientos = movimientos.filter(mov => {
    if (filtroProveedor === 'ALL') return true;
    const provOrigen = mov.almacenOrigen?.proveedor;
    const provDestino = mov.almacenDestino?.proveedor;
    // Si es entrada, nos importa el destino. Si es salida/transferencia, el origen.
    const provRelevante = mov.tipoMovimiento === 'ENTRADA' ? provDestino : provOrigen;
    return provRelevante === filtroProveedor;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2 style={{ margin: 0 }}>Movimientos de Inventario</h2>
          <select 
            className="input-field" 
            style={{ padding: '0.4rem 2rem 0.4rem 0.5rem' }} 
            value={filtroProveedor} 
            onChange={(e) => setFiltroProveedor(e.target.value)}
          >
            <option value="ALL">Todos los Proveedores</option>
            <option value="ASUR">Solo ASUR</option>
            <option value="SITA">Solo SITA</option>
            <option value="OTRO">Solo OTRO</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={exportToCSV} style={{ background: 'var(--color-primary-dark)' }}>
            Exportar CSV
          </button>
          <button 
            className="btn btn-primary" 
            style={{ background: 'var(--color-success)' }}
            onClick={() => { setModalTipo('ENTRADA'); setModalOpen(true); }}
          >
            <ArrowDownToLine size={18} />
            Entrada
          </button>
          <button 
            className="btn btn-primary" 
            style={{ background: 'var(--color-secondary)' }}
            onClick={() => { setModalTipo('SALIDA'); setModalOpen(true); }}
          >
            <ArrowUpFromLine size={18} />
            Salida
          </button>
          <button 
            className="btn btn-primary" 
            style={{ background: 'var(--color-primary-light)' }}
            onClick={() => { setModalTipo('TRANSFERENCIA'); setModalOpen(true); }}
          >
            <ArrowRightLeft size={18} />
            Transferencia
          </button>
        </div>
      </div>

      <div className="card table-container" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Papel</th>
                <th>Proveedor</th>
                <th>Origen</th>
                <th>Destino</th>
                <th>Cantidad</th>
                <th>Fecha</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovimientos.map((mov) => {
                const provOrigen = mov.almacenOrigen?.proveedor;
                const provDestino = mov.almacenDestino?.proveedor;
                const provRelevante = mov.tipoMovimiento === 'ENTRADA' ? provDestino : provOrigen;
                return (
                <tr key={mov.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                      {getIcon(mov.tipoMovimiento)}
                      {mov.tipoMovimiento}
                    </div>
                  </td>
                  <td>{mov.tipoPapel.codigo}</td>
                  <td>
                    {provRelevante ? (
                      <span className={`text-xs font-bold px-2 py-1 rounded ${provRelevante === 'SITA' ? 'bg-blue-900/50 text-blue-400' : (provRelevante === 'ASUR' ? 'bg-green-900/50 text-green-400' : 'bg-gray-800/50 text-gray-300')}`}>
                        {provRelevante}
                      </span>
                    ) : '-'}
                  </td>
                  <td>{mov.almacenOrigen?.nombre || '-'}</td>
                  <td>{mov.almacenDestino?.nombre || '-'}</td>
                  <td style={{ fontWeight: 600 }}>{mov.cantidad}</td>
                  <td>{format(new Date(mov.fechaMovimiento), 'dd/MM/yyyy HH:mm')}</td>
                  <td>{mov.usuario.nombre}</td>
                </tr>
              )})}
              {filteredMovimientos.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>No hay movimientos registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <MovimientoModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        tipoMovimiento={modalTipo} 
        onSuccess={() => fetchMovimientos()} 
      />
    </div>
  );
};

export default Movimientos;
