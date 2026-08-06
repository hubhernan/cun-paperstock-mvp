import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Package, TrendingUp, AlertTriangle, Layers, ServerCrash, PieChart as PieIcon, BarChart2, Calendar } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Bar, Line, PieChart, Pie, Cell, Legend, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

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
  stockAtb: number;
  stockBtp: number;
  consumoHoy: number;
  consumoHoyAtb: number;
  consumoHoyBtp: number;
  alertasStock: number;
}

interface ChartDataState {
  consumoHistorico: any[];
  stockPorAlmacen: any[];
  consumoPorTerminal: any[];
  stockSemanal: any[];
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<KPIs>({
    totalTiposPapel: 0,
    stockTotal: 0,
    stockAtb: 0,
    stockBtp: 0,
    consumoHoy: 0,
    consumoHoyAtb: 0,
    consumoHoyBtp: 0,
    alertasStock: 0,
  });
  const [loading, setLoading] = useState(true);
  const [liveAlerts, setLiveAlerts] = useState<TelemetryAlert[]>([]);
  const [chartData, setChartData] = useState<ChartDataState>({
    consumoHistorico: [],
    stockPorAlmacen: [],
    consumoPorTerminal: [],
    stockSemanal: []
  });

  const fetchData = async () => {
    try {
      const [resKpis, resCharts, resAlerts] = await Promise.all([
        api.get('/dashboard/kpis'),
        api.get('/dashboard/charts'),
        api.get('/alertas')
      ]);

      if (resKpis.data.success) {
        setKpis(resKpis.data.data);
      }
      if (resCharts.data.success) {
        setChartData(resCharts.data.data);
      }
      if (resAlerts.data.success) {
        const alertsMapped = resAlerts.data.data.map((al: any) => {
          let severity = 'GLOBAL';
          const msg = al.mensaje.toUpperCase();
          if (msg.includes('CRÍTICO') || msg.includes('CRITICO') || msg.includes('OFFLINE')) {
            severity = 'CRITICA';
          } else if (msg.includes('NIVEL CRÍTICO') || msg.includes('NIVEL BAJO')) {
            severity = 'NIVEL_1';
          }
          return {
            id: al.id,
            kioskoId: al.tipoPapelId,
            mensaje: al.mensaje,
            severity: severity,
            fecha: al.fecha
          };
        });
        setLiveAlerts(alertsMapped.slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Refresco periódico cada 30 segundos
    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '1rem' }}>
        <div className="skeleton skeleton-title"></div>
        <div className="skeleton skeleton-text short mb-8"></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="skeleton skeleton-box"></div>
          <div className="skeleton skeleton-box"></div>
          <div className="skeleton skeleton-box"></div>
          <div className="skeleton skeleton-box"></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div className="skeleton skeleton-box" style={{ height: 300 }}></div>
          <div className="skeleton skeleton-box" style={{ height: 300 }}></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Bienvenido de nuevo, {user?.nombre}</p>
        </div>
      </div>

      {/* Tarjetas KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Tipos de Papel */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: 0 }}>
          <div style={{ padding: '1.25rem', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', color: 'var(--color-primary)', borderRadius: '16px', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8)' }}>
            <Package size={28} />
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>Tipos de Papel</p>
            <h2 style={{ margin: '0.15rem 0 0 0', fontSize: '1.875rem' }}>{kpis.totalTiposPapel}</h2>
          </div>
        </div>

        {/* Stock Total desglosado */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: 0 }}>
          <div style={{ padding: '1.25rem', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', color: 'var(--color-success)', borderRadius: '16px', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8)' }}>
            <Layers size={28} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>Stock Total (Uds)</p>
            <h2 style={{ margin: '0.15rem 0 0 0', fontSize: '1.875rem' }}>{kpis.stockTotal.toLocaleString()}</h2>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              ATB: <span style={{ color: 'var(--color-primary)' }}>{kpis.stockAtb.toLocaleString()}</span> | BTP: <span style={{ color: 'var(--color-success)' }}>{kpis.stockBtp.toLocaleString()}</span>
            </p>
          </div>
        </div>

        {/* Consumo Hoy desglosado */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: 0 }}>
          <div style={{ padding: '1.25rem', background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', color: 'var(--color-warning)', borderRadius: '16px', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8)' }}>
            <TrendingUp size={28} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>Consumo Hoy</p>
            <h2 style={{ margin: '0.15rem 0 0 0', fontSize: '1.875rem' }}>{kpis.consumoHoy.toLocaleString()}</h2>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              ATB: <span style={{ color: 'var(--color-primary)' }}>{kpis.consumoHoyAtb.toLocaleString()}</span> | BTP: <span style={{ color: 'var(--color-success)' }}>{kpis.consumoHoyBtp.toLocaleString()}</span>
            </p>
          </div>
        </div>

        {/* Alertas de Stock */}
        <div className={`card ${kpis.alertasStock > 0 ? 'alert-pulse' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: 0 }}>
          <div style={{ padding: '1.25rem', background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', color: 'var(--color-danger)', borderRadius: '16px', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8)' }}>
            <AlertTriangle size={28} />
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>Alertas de Stock</p>
            <h2 style={{ margin: '0.15rem 0 0 0', fontSize: '1.875rem' }}>{kpis.alertasStock}</h2>
          </div>
        </div>
      </div>
      
      {/* Primera fila de Gráficas: Alertas y Pastel de Distribución */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Alertas Críticas Recientes</h3>
          </div>
          {liveAlerts.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>No hay alertas críticas recientes.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '250px', overflowY: 'auto' }}>
              {liveAlerts.map(alerta => (
                <li key={alerta.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid #eee', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <ServerCrash size={20} color={alerta.severity === 'CRITICA' ? 'var(--color-danger)' : 'var(--color-warning)'} />
                  <div>
                    <p style={{ margin: 0, fontWeight: 500, fontSize: '0.9rem' }}>{alerta.mensaje}</p>
                    <small style={{ color: 'var(--color-text-muted)' }}>{new Date(alerta.fecha).toLocaleTimeString()}</small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><PieIcon size={20} /> Distribución de Stock por Almacén</h3>
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
                  nameKey="nombre"
                  dataKey="valor"
                >
                  {chartData.stockPorAlmacen.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [`${value} unidades`, name]}
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Segunda fila de Gráficas: Consumo Histórico (7 días) y Consumo por Terminal (ATB vs BTP) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        
        {/* Consumo Histórico (7 Días) */}
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
                <Bar dataKey="ATB" stackId="a" fill="url(#colorATB)" name="ATB" radius={[0, 0, 4, 4]} />
                <Bar dataKey="BTP" stackId="a" fill="url(#colorBTP)" name="BTP" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="colorATB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={1}/>
                  </linearGradient>
                  <linearGradient id="colorBTP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={1}/>
                  </linearGradient>
                </defs>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Consumo por Terminal (ATB vs BTP) */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BarChart2 size={20} /> Consumo por Terminal (ATB vs BTP)</h3>
          </div>
          <div style={{ height: 250, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData.consumoPorTerminal} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                <XAxis dataKey="terminal" stroke="#9ca3af" fontSize={12} tickMargin={10} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="ATB" fill="#3b82f6" name="ATB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="BTP" fill="#10b981" name="BTP" radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tercera fila: Nueva gráfica lineal de Historial Semanal por Almacén */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={20} className="text-blue-500" />
              Historial de Stock Semanal por Almacén
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0 }}>
              Evolución del stock en las últimas 4 semanas para bodegas clave.
            </p>
          </div>
        </div>
        <div style={{ height: 250, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData.stockSemanal} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
              <XAxis dataKey="semana" stroke="#9ca3af" fontSize={12} tickMargin={10} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
              />
              <Legend />
              <Line type="monotone" dataKey="Almacén Central" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} name="Almacén Central" />
              <Line type="monotone" dataKey="Almacén T3" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} name="Almacén T3" />
              <Line type="monotone" dataKey="Almacén T4" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} name="Almacén T4" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
