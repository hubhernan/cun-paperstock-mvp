import React, { createContext, useContext, useState, useEffect } from 'react';
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
  refrescarAlertas: () => Promise<void>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [notificacionActiva, setNotificacionActiva] = useState<Alerta | null>(null);
  const { user } = useAuth();

  const refrescarAlertas = async () => {
    if (user?.rol === 'Admin' || user?.rol === 'Supervisor') {
      try {
        const res = await getAlertasNoLeidas();
        if (res.success) {
          setAlertas(res.data);
        }
      } catch (error) {
        console.error('Error cargando alertas', error);
      }
    }
  };

  useEffect(() => {
    refrescarAlertas();

    // Polling suave de 30 segundos en lugar de WebSockets
    const interval = setInterval(() => {
      refrescarAlertas();
    }, 30000);

    return () => {
      clearInterval(interval);
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
    <AlertContext.Provider value={{ alertas, marcarComoLeida, notificacionActiva, cerrarNotificacion, refrescarAlertas }}>
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
