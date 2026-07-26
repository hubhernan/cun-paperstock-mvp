import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { Package, TrendingUp, AlertTriangle, Layers, Activity, ServerCrash, PieChart as PieIcon, BarChart2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar, Line, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface TelemetryAlert {
  id: string;
  kioskoId: string;
  mensaje: string;
  severity: string;
  fecha: string;
}

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
  const [liveAlerts, setLiveAlerts] = useState<TelemetryAlert[]>([]);
  const [chartData, setChartData] = useState({
    consumoHistorico: [],
    stockPorAlmacen: [],
    consumoPorTipo: []
  });
  const [activeKiosks, setActiveKiosks] = useState(0);
  const [pingHistory, setPingHistory] = useState<{ time: string, pings: number }[]>(Array.from({length: 10}, () => ({ time: '', pings: 0 })));
  const [currentPings, setCurrentPings] = useState(0);
  const currentPingsRef = useRef(0);

  useEffect(() => {
    currentPingsRef.current = currentPings;
  }, [currentPings]);

  const fetchKPIs = async () => {
    try {
      const response = await api.get('/dashboard/kpis');
      if (response.data.success) {
        setKpis(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching KPIs', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCharts = async () => {
    try {
      const response = await api.get('/dashboard/charts');
      if (response.data.success) {
        setChartData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching charts', error);
    }
  };

  useEffect(() => {
    fetchKPIs();
    fetchCharts();

    // Historial de pings cada 3 segundos para la gráfica
    const interval = setInterval(() => {
      const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second:'2-digit' });
      setPingHistory(prev => {
        const newHistory = [...prev, { time, pings: currentPingsRef.current }];
        if (newHistory.length > 20) newHistory.shift();
        return newHistory;
      });
      setCurrentPings(0);
    }, 3000);

    // Conectar a Socket.io
    const socket: Socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000');

    socket.on('stockUpdate', (data) => {
      console.log('Evento de inventario recibido en tiempo real:', data);
      fetchKPIs();
    });

    socket.on('kiosk_telemetry_update', (data) => {
      console.log('Telemetría Kiosko:', data);
      setActiveKiosks(prev => prev + 1);
      setCurrentPings(prev => prev + 1);
    });

    socket.on('nueva_alerta', (data: TelemetryAlert) => {
      console.log('🚨 Nueva Alerta:', data);
      setLiveAlerts(prev => [data, ...prev].slice(0, 10)); // Mantener las últimas 10
      setKpis(prev => ({ ...prev, alertasStock: prev.alertasStock + 1 }));
    });

    return () => {
      clearInterval(interval);
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
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Top Alertas (Tiempo Real)</h3>
            <span style={{ padding: '0.25rem 0.75rem', background: 'var(--color-danger)', color: 'white', borderRadius: '12px', fontSize: '0.8rem' }}>
              En Vivo
            </span>
          </div>
          {liveAlerts.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>No hay alertas críticas recientes.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {liveAlerts.map(alerta => (
                <li key={alerta.id} style={{ padding: '1rem', borderBottom: '1px solid #eee', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <ServerCrash size={20} color={alerta.severity === 'CRITICA' || alerta.severity === 'OFFLINE' ? 'var(--color-danger)' : 'var(--color-warning)'} />
                  <div>
                    <p style={{ margin: 0, fontWeight: 500 }}>{alerta.mensaje}</p>
                    <small style={{ color: 'var(--color-text-muted)' }}>{new Date(alerta.fecha).toLocaleTimeString()}</small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><PieIcon size={20} /> Distribución de Stock</h3>
          </div>
          <div style={{ height: 250, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.stockPorAlmacen}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="valor"
                >
                  {chartData.stockPorAlmacen.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BarChart2 size={20} /> Consumo Histórico (7 Días)</h3>
          </div>
          <div style={{ height: 250, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData.consumoHistorico} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                <XAxis dataKey="fecha" stroke="#9ca3af" fontSize={12} tickMargin={10} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="ATB" stackId="a" fill="#3b82f6" name="ATB" />
                <Bar dataKey="BTP" stackId="a" fill="#10b981" name="BTP" />
                <Bar dataKey="Otros" stackId="a" fill="#f59e0b" name="Otros" />
                <Line type="monotone" dataKey="ATB" stroke="#60a5fa" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BarChart2 size={20} /> Top Papel Consumido</h3>
          </div>
          <div style={{ height: 250, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart layout="vertical" data={chartData.consumoPorTipo} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                <YAxis dataKey="nombre" type="category" stroke="#9ca3af" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="valor" fill="#8b5cf6" name="Cantidad" radius={[0, 4, 4, 0]}>
                  {chartData.consumoPorTipo.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.25rem 0' }}>Actividad de Telemetría (Pings de Kioskos)</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>
              <Activity size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem', color: 'var(--color-success)' }} />
              Se han recibido {activeKiosks} pings en total en esta sesión.
            </p>
          </div>
          <div style={{ background: '#dcfce7', color: 'var(--color-success)', padding: '0.5rem 1rem', borderRadius: '12px', fontWeight: 'bold' }}>
            {currentPings} pings / seg
          </div>
        </div>
        <div style={{ height: 250, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={pingHistory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="var(--color-text-muted)" fontSize={12} tickMargin={10} />
              <YAxis stroke="var(--color-text-muted)" fontSize={12} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: 'var(--color-primary)', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="pings" name="Pings" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorPings)" animationDuration={300} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
