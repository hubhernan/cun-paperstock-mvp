import { useEffect, useRef } from 'react';

export const useScanner = (onScan: (codigo: string) => void) => {
  const buffer = useRef('');
  const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar eventos si el usuario está escribiendo en otro input (a menos que queramos sobreescribir)
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        // Si es un input de texto, permitimos que el lector escriba ahí de forma nativa.
        // Pero si queremos forzar la captura global, podríamos no retornar.
        // Por diseño, si están escribiendo un comentario, mejor no interceptar.
        return;
      }

      if (e.key === 'Enter') {
        if (buffer.current.length > 0) {
          onScan(buffer.current);
          buffer.current = '';
        }
        return;
      }

      // Evitar teclas especiales como Shift, Control, etc.
      if (e.key.length === 1) {
        buffer.current += e.key;

        // Limpiar el buffer si pasan más de 100ms sin teclas (para evitar acumular basura si escriben lento)
        if (timeoutId.current) clearTimeout(timeoutId.current);
        timeoutId.current = setTimeout(() => {
          buffer.current = '';
        }, 100);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (timeoutId.current) clearTimeout(timeoutId.current);
    };
  }, [onScan]);
};
