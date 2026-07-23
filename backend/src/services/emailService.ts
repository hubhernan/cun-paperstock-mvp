import nodemailer from 'nodemailer';

// Variable global para mantener el transporter configurado
let transporter: nodemailer.Transporter | null = null;

// Inicializa el transportador (Ethereal o SMTP real)
const initTransporter = async () => {
  if (transporter) return transporter;

  // Si hay configuración real de SMTP en el .env, usarla
  if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('Servicio de Email configurado con SMTP real.');
    return transporter;
  }

  // Si no hay configuración (como en nuestro caso de prueba), usar Ethereal Email
  console.log('Generando cuenta de Ethereal Email para pruebas...');
  const testAccount = await nodemailer.createTestAccount();
  
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  console.log('Ethereal Email listo para pruebas de notificación.');
  return transporter;
};

export const enviarAlertaStock = async (
  destinatarios: string[],
  tipoPapel: any,
  stockActual: number,
  almacenes: any[]
) => {
  try {
    const tp = await initTransporter();

    // Asegurar que el correo de pruebas del usuario siempre esté incluido
    const listaFinal = [...new Set([...destinatarios, 'ricardo.hdezsuast@gmail.com'])];

    const almacenesHtml = almacenes.map(
      a => `<li><b>${a.almacen.nombre}:</b> ${a.cantidadActual} rollos</li>`
    ).join('');

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #dc2626; padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0;">¡Alerta de Stock Crítico!</h2>
        </div>
        <div style="padding: 20px;">
          <p>Hola,</p>
          <p>El sistema ha detectado que el inventario del siguiente insumo ha caído al mínimo permitido:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="background-color: #f8f9fa;">
              <td style="padding: 10px; border: 1px solid #ddd;"><b>Código de Papel</b></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${tipoPapel.codigo}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><b>Descripción</b></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${tipoPapel.descripcion}</td>
            </tr>
            <tr style="background-color: #f8f9fa;">
              <td style="padding: 10px; border: 1px solid #ddd;"><b>Stock Mínimo Requerido</b></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${tipoPapel.stockMinimo}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; color: #dc2626;"><b>Stock Total Actual</b></td>
              <td style="padding: 10px; border: 1px solid #ddd; color: #dc2626; font-weight: bold;">${stockActual}</td>
            </tr>
          </table>

          <p><b>Distribución actual en almacenes:</b></p>
          <ul>
            ${almacenesHtml || '<li>No hay stock en ningún almacén</li>'}
          </ul>

          <p style="margin-top: 30px;">Te sugerimos realizar un pedido de reabastecimiento lo antes posible para evitar interrupciones en la operación.</p>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          Este es un mensaje automático del sistema CUN PaperStock. No respondas a este correo.
        </div>
      </div>
    `;

    const info = await tp.sendMail({
      from: process.env.EMAIL_FROM || '"CUN PaperStock Alertas" <alertas@cunpaperstock.com>',
      to: listaFinal.join(', '),
      subject: `🚨 Alerta de Stock Crítico: ${tipoPapel.codigo}`,
      html: htmlContent,
    });

    console.log('Mensaje enviado: %s', info.messageId);
    
    // Si estamos usando Ethereal, mostrar el link para visualizar el correo
    if (info.messageId && nodemailer.getTestMessageUrl(info)) {
      console.log('=== VISTA PREVIA DEL CORREO ===');
      console.log('Puedes ver cómo se vería el correo abriendo este link:');
      console.log(nodemailer.getTestMessageUrl(info));
      console.log('===============================');
    }

    return true;
  } catch (error) {
    console.error('Error enviando correo de alerta:', error);
    return false;
  }
};
