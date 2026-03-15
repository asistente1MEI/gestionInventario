import { resend, REMITENTE } from '../config/resend.js';
import { enviarConBrevo } from '../config/brevo.js';
import logger from '../config/logger.js';
import {
    plantillaResetPassword,
    plantillaPasswordRestablecida,
    plantillaBienvenida,
    plantillaCuentaBloqueada
} from '../emails/plantillas.js';

const URL_FRONTEND = process.env.FRONTEND_URL || 'http://localhost:5173';
const MINUTOS_BLOQUEO = 30;
const MINUTOS_RESET   = 30;

// Proveedor activo: 'brevo' (por defecto) o 'resend'
const PROVEEDOR = (process.env.EMAIL_PROVIDER || 'brevo').toLowerCase();

/**
 * Función interna de envío con manejo de errores centralizado.
 * Selecciona el proveedor según EMAIL_PROVIDER.
 */
const enviarCorreo = async ({ to, subject, html }) => {
    // ── Modo desarrollo sin claves ────────────────────────────────────────────
    const sinClave = PROVEEDOR === 'brevo'
        ? !process.env.BREVO_API_KEY
        : !process.env.RESEND_API_KEY;

    if (sinClave) {
        logger.warn(`[EMAIL - desarrollo] Para: ${to} | Asunto: ${subject}`);
        return { ok: true, modo: 'desarrollo' };
    }

    try {
        let id;

        if (PROVEEDOR === 'brevo') {
            // ── Brevo (REST API — funciona en Render, sin verificación de dominio) ──
            const resultado = await enviarConBrevo({ to, subject, html });
            id = resultado.id;
        } else {
            // ── Resend (conservado para uso futuro) ────────────────────────────────
            const resultado = await resend.emails.send({ from: REMITENTE, to, subject, html });
            id = resultado?.data?.id ?? resultado?.id;

            const err = resultado?.error;
            if (err) {
                logger.error(`[EMAIL] Resend rechazó el envío a ${to}: ${JSON.stringify(err)}`);
                return { ok: false, error: JSON.stringify(err) };
            }
        }

        logger.info(`[EMAIL] Enviado vía ${PROVEEDOR} a: ${to} | ID: ${id ?? 'sin-id'}`);
        return { ok: true, id };

    } catch (err) {
        logger.error(`[EMAIL] Error al enviar a ${to}: ${err.message}`);
        return { ok: false, error: err.message };
    }
};

/**
 * Envía el correo de recuperación de contraseña.
 * @param {string} email - Email del destinatario
 * @param {string} nombre - Nombre del usuario
 * @param {string} token - Token de reset
 */
export const enviarCorreoResetPassword = async (email, nombre, token) => {
    const enlace = `${URL_FRONTEND}/reset-password?token=${token}`;
    logger.info(`[EMAIL] Reset password link: ${enlace}`); // útil en desarrollo
    return enviarCorreo({
        to: email,
        subject: 'Recuperacion de contrasena — MEI Inventarios',
        html: plantillaResetPassword(nombre, enlace, MINUTOS_RESET)
    });
};

/**
 * Confirma al usuario que su contraseña fue restablecida.
 */
export const enviarConfirmacionPasswordRestablecida = async (email, nombre) => {
    return enviarCorreo({
        to: email,
        subject: 'Contrasena actualizada — MEI Inventarios',
        html: plantillaPasswordRestablecida(nombre)
    });
};

/**
 * Correo de bienvenida con credenciales temporales.
 * @param {string} email
 * @param {string} nombre
 * @param {string} passwordTemporal - Contraseña en texto plano (antes de hashear)
 */
export const enviarCorreoBienvenida = async (email, nombre, passwordTemporal) => {
    const enlaceLogin = `${URL_FRONTEND}/login`;
    return enviarCorreo({
        to: email,
        subject: 'Bienvenido a MEI — Modulo de Inventarios',
        html: plantillaBienvenida(nombre, email, passwordTemporal, enlaceLogin)
    });
};

/**
 * Notifica al usuario que su cuenta fue bloqueada por intentos fallidos.
 * @param {string} email
 * @param {string} nombre
 * @param {string} ip - IP desde donde se intentó el acceso
 */
export const enviarNotificacionBloqueo = async (email, nombre, ip) => {
    return enviarCorreo({
        to: email,
        subject: 'Cuenta bloqueada temporalmente — MEI Inventarios',
        html: plantillaCuentaBloqueada(nombre, MINUTOS_BLOQUEO, ip)
    });
};
