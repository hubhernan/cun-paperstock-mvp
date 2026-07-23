import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Package, Home, BarChart2, Users, LogOut, Map, ArrowRightLeft, FileText, Bell, X, CheckCircle, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertContext';
import { format } from 'date-fns';

const Layout: React.FC = () => {
  const location = useLocation();
  const { logout, user } = useAuth();
  const { alertas, marcarComoLeida, notificacionActiva, cerrarNotificacion } = useAlerts();
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
          {user?.rol === 'Admin' && (
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
              <Link to="/lotes" className={`nav-link ${isActive('/lotes') ? 'active' : ''}`}>
                <Layers size={20} />
                Lotes (FIFO)
              </Link>
            </>
          )}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="mb-4 px-2">
            <p className="text-sm font-semibold">{user?.nombre}</p>
            <p className="text-xs text-white/60">{user?.rol}</p>
          </div>
          <button onClick={logout} className="nav-link" style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255, 255, 255, 0.7)', padding: '0.75rem 1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <LogOut size={20} />
            <span style={{ fontSize: '1rem', fontFamily: 'inherit' }}>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <h2 className="text-lg font-semibold m-0">Aeropuerto Internacional de Cancún</h2>
          <div className="flex items-center gap-4 relative">
            {(user?.rol === 'Admin' || user?.rol === 'Supervisor') && (
              <div className="relative">
                <button 
                  className="btn btn-icon p-2 text-gray-300 hover:text-white relative bg-transparent border-none cursor-pointer"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <Bell size={24} />
                  {alertas.length > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                      {alertas.length}
                    </span>
                  )}
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded shadow-xl z-50">
                    <div className="p-3 border-b border-gray-700 font-semibold flex justify-between items-center">
                      Notificaciones
                      <button className="text-gray-400 hover:text-white bg-transparent border-none cursor-pointer" onClick={() => setShowDropdown(false)}>
                        <X size={16} />
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {alertas.length === 0 ? (
                        <div className="p-4 text-center text-gray-400 text-sm">
                          No hay alertas nuevas.
                        </div>
                      ) : (
                        alertas.map(alerta => (
                          <div key={alerta.id} className="p-3 border-b border-gray-700 hover:bg-gray-700 flex flex-col gap-1">
                            <span className="text-sm">{alerta.mensaje}</span>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs text-gray-400">
                                {format(new Date(alerta.fecha), 'dd/MM HH:mm')}
                              </span>
                              <button 
                                onClick={() => marcarComoLeida(alerta.id)}
                                className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 bg-transparent border-none cursor-pointer p-0"
                              >
                                <CheckCircle size={14} /> Marcar Leída
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
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
