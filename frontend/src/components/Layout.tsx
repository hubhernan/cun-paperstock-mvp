import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Package, Home, BarChart2, Users, LogOut, Map, ArrowRightLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout: React.FC = () => {
  const location = useLocation();
  const { logout, user } = useAuth();

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
          <div className="flex items-center gap-4">
            {/* Opcional: Alertas, Perfil, etc */}
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
