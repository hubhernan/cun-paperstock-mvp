import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { Package, TrendingUp, AlertTriangle, Layers } from 'lucide-react';

interface KPIs {
  totalTiposPapel: number;
  stockTotal: number;
  consumoHoy: number;
  alertasStock: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<KPIs>({
    totalTiposPapel: 0,
    stockTotal: 0,
    consumoHoy: 0,
    alertasStock: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchKPIs = async () => {
    try {
      const response = await axios.get((import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/dashboard/kpis');
      if (response.data.success) {
        setKpis(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching KPIs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKPIs();

    // Conectar a Socket.io
    const socket: Socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000');

    socket.on('stockUpdate', (data) => {
      console.log('Evento de inventario recibido en tiempo real:', data);
      // Actualizar los KPIs cuando hay un movimiento
      fetchKPIs();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (loading) return <div>Cargando dashboard...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Bienvenido de nuevo, {user?.nombre}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: 0 }}>
          <div style={{ padding: '1rem', background: '#e0e7ff', color: 'var(--color-primary)', borderRadius: '50%' }}>
            <Package size={24} />
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Total Tipos de Papel</p>
            <h2 style={{ margin: 0 }}>{kpis.totalTiposPapel}</h2>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: 0 }}>
          <div style={{ padding: '1rem', background: '#dcfce7', color: 'var(--color-success)', borderRadius: '50%' }}>
            <Layers size={24} />
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Stock Total (Unidades)</p>
            <h2 style={{ margin: 0 }}>{kpis.stockTotal.toLocaleString()}</h2>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: 0 }}>
          <div style={{ padding: '1rem', background: '#fef3c7', color: 'var(--color-warning)', borderRadius: '50%' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Consumo Hoy</p>
            <h2 style={{ margin: 0 }}>{kpis.consumoHoy.toLocaleString()}</h2>
          </div>
        </div>

        <div className={`card ${kpis.alertasStock > 0 ? 'alert-pulse' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: 0, border: kpis.alertasStock > 0 ? '1px solid var(--color-danger)' : undefined }}>
          <div style={{ padding: '1rem', background: '#fee2e2', color: 'var(--color-danger)', borderRadius: '50%' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Alertas de Stock</p>
            <h2 style={{ margin: 0 }}>{kpis.alertasStock}</h2>
          </div>
        </div>
      </div>
      
      <div className="card">
        <h3>Última Actualización en Tiempo Real</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Conectado al servidor vía Socket.io de forma exitosa.</p>
      </div>
    </div>
  );
};

export default Dashboard;
