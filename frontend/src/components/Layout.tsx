import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Package, Home, BarChart2, Users, LogOut, Map, ArrowRightLeft, FileText, Bell, X, CheckCircle, Layers, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertContext';
import { format } from 'date-fns';

const Layout: React.FC = () => {
  const location = useLocation();
  const { logout, user } = useAuth();
  const { alertas, marcarComoLeida, notificacionActiva, cerrarNotificacion, refrescarAlertas } = useAlerts();
  const [showDropdown, setShowDropdown] = React.useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Package className="text-white" size={24} />
          CUN PaperStock
        </div>
        <nav className="sidebar-nav">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            <Home size={20} />
            Dashboard
          </Link>
          <Link to="/catalogo" className={`nav-link ${isActive('/catalogo') ? 'active' : ''}`}>
            <Package size={20} />
            Catálogo
          </Link>
          <Link to="/almacenes" className={`nav-link ${isActive('/almacenes') ? 'active' : ''}`}>
            <BarChart2 size={20} />
            Almacenes
          </Link>
          <Link to="/areas" className={`nav-link ${isActive('/areas') ? 'active' : ''}`}>
            <Map size={20} />
            Áreas y Periféricos
          </Link>
          <Link to="/movimientos" className={`nav-link ${isActive('/movimientos') ? 'active' : ''}`}>
            <ArrowRightLeft size={20} />
            Movimientos
          </Link>
          <Link to="/alertas" className={`nav-link ${isActive('/alertas') ? 'active' : ''}`}>
            <Bell size={20} />
            Alertas
            {alertas.length > 0 && (
              <span style={{ marginLeft: 'auto', background: 'var(--color-danger)', color: 'white', padding: '0.15rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                {alertas.length}
              </span>
            )}
          </Link>
          {(user?.rol === 'Admin' || user?.rol === 'Supervisor' || user?.rol === 'Operador') && (
            <Link to="/usuarios" className={`nav-link ${isActive('/usuarios') ? 'active' : ''}`}>
              <Users size={20} />
              Usuarios
            </Link>
          )}
          {(user?.rol === 'Admin' || user?.rol === 'Supervisor') && (
            <>
              <Link to="/reportes" className={`nav-link ${isActive('/reportes') ? 'active' : ''}`}>
                <FileText size={20} />
                Reportes
              </Link>
              <Link to="/incidentes" className={`nav-link ${isActive('/incidentes') ? 'active' : ''}`}>
                <AlertTriangle size={20} />
                Incidentes
              </Link>
              <Link to="/auditoria" className={`nav-link ${isActive('/auditoria') ? 'active' : ''}`}>
                <Users size={20} />
                Auditoría
              </Link>
            </>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="mb-4 px-2">
            <p className="text-sm font-semibold">{user?.nombre}</p>
            <p className="text-xs text-white/60">{user?.rol}</p>
          </div>
          <button onClick={logout} className="nav-link" style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255, 255, 255, 0.7)', padding: '0.85rem 1.25rem', display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
            <LogOut size={20} />
            <span style={{ fontSize: '1rem', fontFamily: 'inherit' }}>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <h2 className="text-lg font-semibold m-0">Aeropuerto Internacional de Cancún</h2>
        </header>
        <div className="page-content relative">
          {notificacionActiva && (
            <div className="absolute top-4 right-4 bg-red-600 text-white p-4 rounded shadow-lg z-50 flex items-start gap-3 w-80 animate-bounce">
              <Bell size={24} className="mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-bold m-0 mb-1">¡Alerta de Stock Bajo!</h4>
                <p className="text-sm m-0 leading-tight">{notificacionActiva.mensaje}</p>
              </div>
              <button 
                className="text-white hover:text-gray-200 bg-transparent border-none cursor-pointer p-0 flex-shrink-0"
                onClick={cerrarNotificacion}
              >
                <X size={18} />
              </button>
            </div>
          )}
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
