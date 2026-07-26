import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Shield, Activity } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  accion: string;
  entidad: string;
  detalles: string;
  ip: string;
  fecha: string;
  usuario: { nombre: string; email: string };
}

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  activo: boolean;
  turno?: string;
  dispositivo?: string;
  rol: { nombre: string };
}

const Usuarios: React.FC = () => {
  const { user, token } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuditoria = async () => {
      try {
        const [resAudit, resUsr] = await Promise.all([
          axios.get((import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/auditoria', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get((import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/usuarios', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        if (resAudit.data.success) setLogs(resAudit.data.data);
        if (resUsr.data.success) setUsuarios(resUsr.data.data);
      } catch (error) {
        console.error('Error fetching data', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.rol === 'Admin') {
      fetchAuditoria();
    } else {
      setLoading(false);
    }
  }, [user, token]);

  if (user?.rol !== 'Admin') {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <Shield size={48} color="var(--color-danger)" style={{ marginBottom: '1rem' }} />
        <h2>Acceso Denegado</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>No tienes permisos de Administrador para ver esta sección.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Panel de Administración de Usuarios</h2>
      </div>

      <div className="card table-container" style={{ padding: 0, marginBottom: '2rem' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <Shield size={20} color="var(--color-primary)" />
          Personal e Ingenieros de Campo
        </div>
        
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando usuarios...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Turno</th>
                <th>Dispositivo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usr) => (
                <tr key={usr.id}>
                  <td style={{ fontWeight: 600 }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>{usr.nombre}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{usr.email}</span>
                    </div>
                  </td>
                  <td>{usr.rol.nombre}</td>
                  <td>{usr.turno || '-'}</td>
                  <td>{usr.dispositivo || '-'}</td>
                  <td>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${usr.activo ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                      {usr.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card table-container" style={{ padding: 0 }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <Activity size={20} color="var(--color-primary)" />
          Registro de Actividad (Log de Auditoría)
        </div>
        
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando auditoría...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Acción</th>
                <th>Usuario</th>
                <th>Módulo</th>
                <th>Detalles</th>
                <th>IP</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontWeight: 600 }}>{log.accion}</td>
                  <td>{log.usuario.nombre}</td>
                  <td>{log.entidad}</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{log.detalles}</td>
                  <td style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{log.ip || '-'}</td>
                  <td>{format(new Date(log.fecha), 'dd/MM/yyyy HH:mm')}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No hay registros de auditoría.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Usuarios;
