/**
 * brevo.js — Configuración del cliente HTTP para Brevo (ex-Sendinblue)
 * Usamos la REST API directamente (sin paquete extra) para máxima compatibilidad con Render.
 *
 * Docs: https://developers.brevo.com/reference/sendtransacemail
 */
import logger from './logger.js';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

if (!process.env.BREVO_API_KEY) {
    logger.warn('BREVO_API_KEY no configurado — los correos se simularán en desarrollo');
}

/**
 * Envía un email transaccional usando la REST API de Brevo.
 * @param {{ to: string, subject: string, html: string, fromName?: string, fromEmail?: string }} opciones
 */
export const enviarConBrevo = async ({ to, subject, html, fromName, fromEmail }) => {
    const nombre  = fromName  || process.env.BREVO_FROM_NAME  || 'MEI Inventarios';
    const correo  = fromEmail || process.env.BREVO_FROM_EMAIL || 'noreply@example.com';

    const cuerpo = {
        sender:      { name: nombre, email: correo },
        to:          [{ email: to }],
        subject,
        htmlContent: html,
    };

    const respuesta = await fetch(BREVO_API_URL, {
        method:  'POST',
        headers: {
            'accept':       'application/json',
            'content-type': 'application/json',
            'api-key':      process.env.BREVO_API_KEY,
        },
        body: JSON.stringify(cuerpo),
    });

    const json = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
        throw new Error(JSON.stringify(json));
    }

    return { id: json.messageId };
};
