import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowRightLeft, ArrowDownToLine, ArrowUpFromLine, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface Movimiento {
  id: string;
  tipoMovimiento: string;
  cantidad: number;
  fechaMovimiento: string;
  comentarios: string;
  tipoPapel: { codigo: string; descripcion: string };
  almacenOrigen: { nombre: string } | null;
  almacenDestino: { nombre: string } | null;
  usuario: { nombre: string };
}

const Movimientos: React.FC = () => {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovimientos = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/movimientos');
        if (response.data.success) {
          setMovimientos(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching movimientos', error);
      } finally {
        setLoading(false);
      }
    };
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Movimientos de Inventario</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={exportToCSV} style={{ background: 'var(--color-primary-dark)' }}>
            Exportar CSV
          </button>
          <button className="btn btn-primary" style={{ background: 'var(--color-success)' }}>
            <ArrowDownToLine size={18} />
            Entrada
          </button>
          <button className="btn btn-primary" style={{ background: 'var(--color-secondary)' }}>
            <ArrowRightLeft size={18} />
            Transferencia / Salida
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
                <th>Origen</th>
                <th>Destino</th>
                <th>Cantidad</th>
                <th>Fecha</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((mov) => (
                <tr key={mov.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                      {getIcon(mov.tipoMovimiento)}
                      {mov.tipoMovimiento}
                    </div>
                  </td>
                  <td>{mov.tipoPapel.codigo}</td>
                  <td>{mov.almacenOrigen?.nombre || '-'}</td>
                  <td>{mov.almacenDestino?.nombre || '-'}</td>
                  <td style={{ fontWeight: 600 }}>{mov.cantidad}</td>
                  <td>{format(new Date(mov.fechaMovimiento), 'dd/MM/yyyy HH:mm')}</td>
                  <td>{mov.usuario.nombre}</td>
                </tr>
              ))}
              {movimientos.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No hay movimientos registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Movimientos;
