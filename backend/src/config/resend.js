import { Resend } from 'resend';
import logger from './logger.js';

if (!process.env.RESEND_API_KEY) {
    logger.warn('RESEND_API_KEY no configurado — los correos no se enviarán');
}

export const resend = new Resend(process.env.RESEND_API_KEY);
export const REMITENTE = process.env.RESEND_FROM_EMAIL || 'MEI Inventarios <noreply@tudominio.com>';
