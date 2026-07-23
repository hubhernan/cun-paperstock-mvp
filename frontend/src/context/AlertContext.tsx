import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAlertasNoLeidas, marcarAlertaComoLeida } from '../services/alertasService';
import { useAuth } from './AuthContext';

interface Alerta {
  id: string;
  mensaje: string;
  fecha: string;
  tipoPapel?: { codigo: string };
}

interface AlertContextType {
  alertas: Alerta[];
  marcarComoLeida: (id: string) => Promise<void>;
  notificacionActiva: Alerta | null;
  cerrarNotificacion: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [notificacionActiva, setNotificacionActiva] = useState<Alerta | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    let socket: Socket;

    const inicializar = async () => {
      if (user?.rol === 'Admin' || user?.rol === 'Supervisor') {
        try {
          const res = await getAlertasNoLeidas();
          if (res.success) {
            setAlertas(res.data);
          }

          socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000');
          socket.on('nuevaAlerta', (alerta: Alerta) => {
            setAlertas(prev => [alerta, ...prev]);
            setNotificacionActiva(alerta);
            
            // Ocultar notificación visual después de 5 segundos
            setTimeout(() => {
              setNotificacionActiva(null);
            }, 5000);
          });
        } catch (error) {
          console.error('Error cargando alertas', error);
        }
      }
    };

    inicializar();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user]);

  const marcarComoLeida = async (id: string) => {
    try {
      await marcarAlertaComoLeida(id);
      setAlertas(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error al marcar como leída', error);
    }
  };

  const cerrarNotificacion = () => setNotificacionActiva(null);

  return (
    <AlertContext.Provider value={{ alertas, marcarComoLeida, notificacionActiva, cerrarNotificacion }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
};
