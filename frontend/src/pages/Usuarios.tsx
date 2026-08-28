import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  UserPlus, 
  Search, 
  Edit3, 
  Power, 
  Key, 
  X, 
  CheckCircle, 
  AlertTriangle,
  UserCheck,
  UserX,
  Smartphone,
  Clock,
  Lock,
  Wifi,
  WifiOff,
  Activity
} from 'lucide-react';
import { 
  getUsuarios, 
  getRoles, 
  createUsuario, 
  updateUsuario, 
  toggleUsuarioActivo, 
  resetUsuarioPassword,
  Usuario,
  Rol
} from '../services/usuariosService';
import { format } from 'date-fns';

const Usuarios: React.FC = () => {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filtros y Búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRol, setFilterRol] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterPresencia, setFilterPresencia] = useState('');

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editUsuario, setEditUsuario] = useState<Usuario | null>(null);
  const [resetPassUsuario, setResetPassUsuario] = useState<Usuario | null>(null);

  // Form states - Crear Usuario
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rolNombre, setRolNombre] = useState('Operador');
  const [turno, setTurno] = useState('Matutino');
  const [dispositivo, setDispositivo] = useState('iPad');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form states - Editar Usuario
  const [editNombre, setEditNombre] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRolNombre, setEditRolNombre] = useState('');
  const [editTurno, setEditTurno] = useState('');
  const [editDispositivo, setEditDispositivo] = useState('');

  // Form states - Reset Password
  const [newPassword, setNewPassword] = useState('');

  const rolUpper = (user?.rol || '').toUpperCase();
  const isSuperUser = rolUpper.includes('ADMIN') || rolUpper.includes('SUPERVISOR');

  const fetchDatos = async () => {
    setLoading(true);
    setError('');
    try {
      const [resUsr, resRoles] = await Promise.all([
        getUsuarios(),
        getRoles()
      ]);
      setUsuarios(resUsr);
      setRoles(resRoles);
    } catch (err) {
      console.error(err);
      setError('Error al cargar la lista de usuarios y roles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatos();
    const interval = setInterval(() => {
      fetchDatos();
    }, 4000); // Polling automático cada 4 segundos para actualizar presencia en línea en tiempo real

    return () => clearInterval(interval);
  }, []);

  // Filtrado dinámico
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(usr => {
      const query = searchQuery.toLowerCase().trim();
      const matchQuery = 
        usr.nombre.toLowerCase().includes(query) ||
        usr.email.toLowerCase().includes(query) ||
        (usr.turno || '').toLowerCase().includes(query) ||
        (usr.dispositivo || '').toLowerCase().includes(query);

      const matchRol = filterRol ? usr.rol.nombre === filterRol : true;
      const matchEstado = filterEstado ? (filterEstado === 'ACTIVE' ? usr.activo : !usr.activo) : true;
      const matchPresencia = filterPresencia ? (filterPresencia === 'ONLINE' ? usr.enLinea : !usr.enLinea) : true;

      return matchQuery && matchRol && matchEstado && matchPresencia;
    });
  }, [usuarios, searchQuery, filterRol, filterEstado, filterPresencia]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!nombre || !email || !password || !rolNombre) {
      setFormError('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setSubmitting(true);
      await createUsuario({
        nombre,
        email,
        password,
        rolNombre,
        turno,
        dispositivo
      });
      setShowCreateModal(false);
      setSuccessMsg(`Usuario ${nombre} dado de alta exitosamente.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      
      // Reset form
      setNombre('');
      setEmail('');
      setPassword('');
      setRolNombre('Operador');
      setTurno('Matutino');
      setDispositivo('iPad');
      fetchDatos();
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Error al registrar el usuario');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditModal = (usr: Usuario) => {
    setEditUsuario(usr);
    setEditNombre(usr.nombre);
    setEditEmail(usr.email);
    setEditPassword('');
    setEditRolNombre(usr.rol.nombre);
    setEditTurno(usr.turno || 'Matutino');
    setEditDispositivo(usr.dispositivo || 'iPad');
    setFormError('');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUsuario) return;
    setFormError('');

    try {
      setSubmitting(true);
      await updateUsuario(editUsuario.id, {
        nombre: editNombre,
        email: editEmail,
        password: editPassword.trim() ? editPassword.trim() : undefined,
        rolNombre: editRolNombre,
        turno: editTurno,
        dispositivo: editDispositivo
      });
      setEditUsuario(null);
      setSuccessMsg(`Datos y privilegios de ${editNombre} actualizados correctamente.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchDatos();
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Error al actualizar usuario');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActivo = async (usr: Usuario) => {
    const accionTexto = usr.activo ? 'DAR DE BAJA' : 'DAR DE ALTA';
    if (!window.confirm(`¿Confirmas ${accionTexto} al usuario ${usr.nombre}?`)) return;

    try {
      const res = await toggleUsuarioActivo(usr.id);
      setSuccessMsg(res.message || `Usuario ${usr.nombre} ha sido ${usr.activo ? 'dado de BAJA' : 'dado de ALTA'}.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchDatos();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Error al cambiar el estado del usuario');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassUsuario || !newPassword.trim()) return;

    try {
      setSubmitting(true);
      await resetUsuarioPassword(resetPassUsuario.id, newPassword);
      setResetPassUsuario(null);
      setNewPassword('');
      setSuccessMsg(`Contraseña restablecida correctamente para ${resetPassUsuario.nombre}.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Error al restablecer contraseña');
    } finally {
      setSubmitting(false);
    }
  };

  const getRolBadge = (rolNombre: string) => {
    switch (rolNombre) {
      case 'Admin':
        return <span style={{ padding: '0.25rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: '#f3e8ff', color: '#7e22ce', border: '1px solid #d8b4fe', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>👑 Admin (Super User)</span>;
      case 'Supervisor':
        return <span style={{ padding: '0.25rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>📋 Supervisor</span>;
      case 'Operador':
      default:
        return <span style={{ padding: '0.25rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #86efac', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>🔧 Operador Campo</span>;
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary-dark)' }}>
            <Shield className="text-purple-600" size={28} />
            Directorio de Usuarios y Permisos {isSuperUser ? '(Modo Super Usuario)' : '(Modo Lectura)'}
          </h2>
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
            {isSuperUser ? 'Gestión de cuentas (alta/baja), presencia en línea y asignación de derechos' : 'Consulta de personal registrado, estatus de cuenta y presencia en tiempo real'}
          </p>
        </div>
        {isSuperUser && (
          <button 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#7e22ce' }}
            onClick={() => { setShowCreateModal(true); setFormError(''); }}
          >
            <UserPlus size={18} />
            + Dar de Alta Nuevo Usuario
          </button>
        )}
      </div>

      {/* Mensajes de Notificación */}
      {successMsg && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #86efac', borderRadius: '8px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} />
          <strong>{successMsg}</strong>
        </div>
      )}

      {error && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '1.25rem' }}>
          {error}
        </div>
      )}

      {/* Panel de Búsqueda y Filtros */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          
          {/* Campo de Búsqueda por Texto */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.45rem 0.75rem', gap: '0.5rem' }}>
            <Search size={16} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, correo, turno o dispositivo..."
              style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filtro por Rol */}
          <select 
            className="input-field"
            style={{ margin: 0, background: 'white' }}
            value={filterRol}
            onChange={e => setFilterRol(e.target.value)}
          >
            <option value="">Todos los Roles</option>
            <option value="Admin">👑 Admin (Super Usuario)</option>
            <option value="Supervisor">📋 Supervisor</option>
            <option value="Operador">🔧 Operador Campo</option>
          </select>

          {/* Filtro por Estatus de Cuenta */}
          <select 
            className="input-field"
            style={{ margin: 0, background: 'white' }}
            value={filterEstado}
            onChange={e => setFilterEstado(e.target.value)}
          >
            <option value="">Todos los Estatus</option>
            <option value="ACTIVE">🟢 Habilitado (En Alta)</option>
            <option value="INACTIVE">🔴 Suspendido (En Baja)</option>
          </select>

          {/* Filtro por Presencia en Tiempo Real */}
          <select 
            className="input-field"
            style={{ margin: 0, background: 'white' }}
            value={filterPresencia}
            onChange={e => setFilterPresencia(e.target.value)}
          >
            <option value="">Toda la Presencia</option>
            <option value="ONLINE">🟢 Solo En Línea (Trabajando)</option>
            <option value="OFFLINE">⚪ Solo Fuera de Turno</option>
          </select>

        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="card table-container" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Cargando personal registrado...</div>
        ) : usuariosFiltrados.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            No se encontraron usuarios para los criterios seleccionados.
          </div>
        ) : (
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>NOMBRE E INGENIERO</th>
                <th>ROL Y DERECHOS</th>
                <th>ESTATUS DE CUENTA</th>
                <th>PRESENCIA EN LÍNEA</th>
                <th>TURNO Y DISPOSITIVO</th>
                <th>{isSuperUser ? 'ACCIONES DE SUPER USUARIO' : 'PERMISOS'}</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((usr) => (
                <tr key={usr.id} style={{ opacity: usr.activo ? 1 : 0.55, background: usr.activo ? 'transparent' : '#f8fafc' }}>
                  <td>
                    <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{usr.nombre}</div>
                    <small style={{ color: '#64748b' }}>{usr.email}</small>
                  </td>

                  <td>{getRolBadge(usr.rol.nombre)}</td>

                  {/* 1. ESTATUS DE CUENTA (ADMINISTRATIVO) */}
                  <td>
                    <span style={{ 
                      padding: '0.25rem 0.6rem', 
                      borderRadius: '12px', 
                      fontSize: '0.75rem', 
                      fontWeight: 'bold',
                      backgroundColor: usr.activo ? '#dcfce7' : '#fee2e2', 
                      color: usr.activo ? '#166534' : '#991b1b',
                      border: usr.activo ? '1px solid #86efac' : '1px solid #fca5a5',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      {usr.activo ? <UserCheck size={14} /> : <UserX size={14} />}
                      {usr.activo ? 'Habilitado (En Alta)' : 'Suspendido (En Baja)'}
                    </span>
                  </td>

                  {/* 2. PRESENCIA EN TIEMPO REAL (OPERATIVO EN LÍNEA) */}
                  <td>
                    {usr.activo ? (
                      <div>
                        <span style={{ 
                          padding: '0.25rem 0.6rem', 
                          borderRadius: '12px', 
                          fontSize: '0.75rem', 
                          fontWeight: 'bold',
                          backgroundColor: usr.enLinea ? '#e0f2fe' : '#f1f5f9', 
                          color: usr.enLinea ? '#0369a1' : '#64748b',
                          border: usr.enLinea ? '1px solid #93c5fd' : '1px solid #cbd5e1',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}>
                          {usr.enLinea ? (
                            <>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }} />
                              En Línea (Conectado)
                            </>
                          ) : (
                            <>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#94a3b8', display: 'inline-block' }} />
                              Fuera de Turno
                            </>
                          )}
                        </span>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                          {usr.ultimaActividad 
                            ? `Última activ: ${format(new Date(usr.ultimaActividad), 'dd/MM HH:mm')} hrs`
                            : 'Sin sesión reciente'
                          }
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>Bloqueado por baja</span>
                    )}
                  </td>

                  {/* TURNO Y DISPOSITIVO */}
                  <td>
                    <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Clock size={13} className="text-gray-400" />
                        <strong>{usr.turno || 'Matutino'}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>
                        <Smartphone size={12} className="text-gray-400" />
                        {usr.dispositivo || 'iPad'}
                      </div>
                    </div>
                  </td>

                  {/* ACCIONES */}
                  <td>
                    {isSuperUser ? (
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        {/* Botón Editar Derechos */}
                        <button 
                          className="btn"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: '#3b82f6', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                          onClick={() => handleOpenEditModal(usr)}
                          title="Editar Datos y Asignar Rol"
                        >
                          <Edit3 size={15} />
                          Editar / Rol
                        </button>

                        {/* Botón Restablecer Contraseña */}
                        <button 
                          className="btn"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: '#f59e0b', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                          onClick={() => { setResetPassUsuario(usr); setNewPassword(''); }}
                          title="Restablecer Contraseña"
                        >
                          <Key size={15} />
                          Password
                        </button>

                        {/* Botón Alta / Baja (Toggle Activo) */}
                        <button 
                          className="btn"
                          style={{ 
                            padding: '0.25rem 0.5rem', 
                            fontSize: '0.8rem', 
                            background: usr.activo ? '#ef4444' : '#10b981', 
                            color: 'white',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem'
                          }}
                          onClick={() => handleToggleActivo(usr)}
                          title={usr.activo ? 'Dar de Baja (Bloquear acceso)' : 'Dar de Alta (Reactivar acceso)'}
                        >
                          <Power size={15} />
                          {usr.activo ? 'Baja' : 'Alta'}
                        </button>
                      </div>
                    ) : (
                      <span style={{ 
                        fontSize: '0.75rem', 
                        color: '#64748b', 
                        fontStyle: 'italic', 
                        padding: '0.25rem 0.6rem', 
                        background: '#f1f5f9', 
                        borderRadius: '12px', 
                        border: '1px solid #cbd5e1',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem' 
                      }}>
                        <Lock size={13} /> Solo Lectura (Sin Permisos)
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL 1: CREAR NUEVO USUARIO (ALTA) */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#7e22ce' }}>
                <UserPlus size={22} />
                Alta de Nuevo Usuario
              </h2>
              <button className="btn-icon" onClick={() => setShowCreateModal(false)}><X /></button>
            </div>

            {formError && <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.9rem' }}>{formError}</div>}

            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label>Nombre Completo del Ingeniero / Personal</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ej. Roberto Gómez"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Correo Electrónico (Acceso CUN)</label>
                <input 
                  type="email" 
                  className="input-field" 
                  placeholder="ej. roberto@cun.mx"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Contraseña Inicial de Acceso</label>
                <input 
                  type="password" 
                  className="input-field" 
                  placeholder="Minimo 4 caracteres (ej. operador123)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Rol y Nivel de Derechos</label>
                <select 
                  className="input-field"
                  value={rolNombre}
                  onChange={e => setRolNombre(e.target.value)}
                  required
                >
                  <option value="Operador">🔧 Operador Campo (Atención Kioskos y Semáforos)</option>
                  <option value="Supervisor">📋 Supervisor (Almacenes, Movimientos, Alertas y Reportes)</option>
                  <option value="Admin">👑 Admin Super Usuario (Acceso Total y Seguridad)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Turno Operativo</label>
                  <select className="input-field" value={turno} onChange={e => setTurno(e.target.value)}>
                    <option value="Matutino">Matutino (06:00 - 14:00)</option>
                    <option value="Vespertino">Vespertino (14:00 - 22:00)</option>
                    <option value="Nocturno">Nocturno (22:00 - 06:00)</option>
                    <option value="Sabatino">Sabatino / Fin de Semana</option>
                    <option value="Rolado">Turno Rolado</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Dispositivo Asignado</label>
                  <select className="input-field" value={dispositivo} onChange={e => setDispositivo(e.target.value)}>
                    <option value="iPad">iPad</option>
                    <option value="Pixel 10">Pixel 10</option>
                    <option value="HP Server">HP Server</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)} disabled={submitting}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#7e22ce' }} disabled={submitting}>
                  {submitting ? 'Registrando...' : 'Confirmar Alta de Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR USUARIO Y REASIGNAR DERECHOS */}
      {editUsuario && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#2563eb' }}>
                <Edit3 size={22} />
                Editar Usuario y Derechos de Acceso
              </h2>
              <button className="btn-icon" onClick={() => setEditUsuario(null)}><X /></button>
            </div>

            {formError && <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.9rem' }}>{formError}</div>}

            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Nombre del Ingeniero</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editNombre}
                  onChange={e => setEditNombre(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Correo Electrónico / Usuario</label>
                <input 
                  type="email" 
                  className="input-field" 
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Nueva Contraseña (Opcional)</label>
                <input 
                  type="password" 
                  className="input-field" 
                  placeholder="Dejar en blanco para mantener la contraseña actual"
                  value={editPassword}
                  onChange={e => setEditPassword(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 'bold', color: '#1e293b' }}>Rol y Nivel de Derechos (Acceso al Sistema)</label>
                <select 
                  className="input-field"
                  value={editRolNombre}
                  onChange={e => setEditRolNombre(e.target.value)}
                  required
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.nombre}>
                      {r.nombre === 'Admin' ? '👑 Admin Super Usuario (Acceso Total y Seguridad)' :
                       r.nombre === 'Supervisor' ? '📋 Supervisor (Almacenes, Alertas y Reportes)' :
                       '🔧 Operador Campo (Atención Kioskos y Semáforos)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Matriz de Resumen de Permisos */}
              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <strong style={{ display: 'block', marginBottom: '0.3rem', color: '#334155' }}>
                  <Lock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Derechos otorgados por el Rol seleccionado ({editRolNombre}):
                </strong>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#475569' }}>
                  {editRolNombre === 'Admin' && (
                    <>
                      <li>Acceso Total a todos los Módulos del Sistema</li>
                      <li>Gestión de Usuarios, Altas, Bajas y Restablecimiento de Passwords</li>
                      <li>Consulta de Bitácora de Auditoría y Exportación</li>
                    </>
                  )}
                  {editRolNombre === 'Supervisor' && (
                    <>
                      <li>Control de Stock en Almacenes y Recuentos Físicos</li>
                      <li>Gestión del Panel de Alertas Inteligentes</li>
                      <li>Resolución e Investigación de Incidentes</li>
                      <li>Generación y Exportación de Reportes Avanzados</li>
                    </>
                  )}
                  {editRolNombre === 'Operador' && (
                    <>
                      <li>Actualización de Semáforos (🟢 Óptimo, 🟠 Naranja, 🔴 Crítico)</li>
                      <li>Registro de Cambios de Papel en Kioskos (ATB / BTP)</li>
                      <li>Consulta del Stock disponible en Almacenes</li>
                    </>
                  )}
                </ul>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Turno Operativo</label>
                  <select className="input-field" value={editTurno} onChange={e => setEditTurno(e.target.value)}>
                    <option value="Matutino">Matutino</option>
                    <option value="Vespertino">Vespertino</option>
                    <option value="Nocturno">Nocturno</option>
                    <option value="Sabatino">Sabatino</option>
                    <option value="Rolado">Rolado</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Dispositivo Asignado</label>
                  <select className="input-field" value={editDispositivo} onChange={e => setEditDispositivo(e.target.value)}>
                    <option value="iPad">iPad</option>
                    <option value="Pixel 10">Pixel 10</option>
                    <option value="HP Server">HP Server</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditUsuario(null)} disabled={submitting}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Guardando...' : 'Guardar Cambios y Derechos'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RESTABLECER CONTRASEÑA */}
      {resetPassUsuario && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#d97706' }}>
                <Key size={22} />
                Restablecer Contraseña
              </h2>
              <button className="btn-icon" onClick={() => setResetPassUsuario(null)}><X /></button>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1.25rem', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Usuario:</div>
              <strong style={{ color: '#0f172a', fontSize: '1rem' }}>{resetPassUsuario.nombre} ({resetPassUsuario.email})</strong>
            </div>

            <form onSubmit={handleResetPasswordSubmit}>
              <div className="form-group">
                <label>Ingresa la Nueva Contraseña para el Usuario:</label>
                <input 
                  type="password" 
                  className="input-field" 
                  placeholder="Minimo 4 caracteres (ej. nuevoPassword123)"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setResetPassUsuario(null)} disabled={submitting}>Cancelar</button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ background: '#f59e0b', color: 'white' }}
                  disabled={submitting || newPassword.trim().length < 4}
                >
                  {submitting ? 'Restableciendo...' : 'Guardar Nueva Contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;
