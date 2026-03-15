import jwt from 'jsonwebtoken';
import { respuestaError } from '../utils/respuesta.js';
import supabase from '../config/supabase.js';
import logger from '../config/logger.js';

/**
 * Middleware: verifica el Access Token JWT en el header Authorization
 */
export const autenticar = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return respuestaError(res, 'Token de acceso requerido', 401);
        }

        const token = authHeader.split(' ')[1];
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        // Verificar que el usuario siga activo en base de datos
        const { data: usuario, error } = await supabase
            .from('usuarios')
            .select('id, nombre, email, rol, activo, forzar_cambio_password')
            .eq('id', payload.usuarioId)
            .single();

        if (error || !usuario) {
            return respuestaError(res, 'Usuario no encontrado', 401);
        }

        if (!usuario.activo) {
            return respuestaError(res, 'Cuenta de usuario desactivada', 401);
        }

        req.usuario = usuario;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return respuestaError(res, 'Token expirado', 401);
        }
        if (err.name === 'JsonWebTokenError') {
            return respuestaError(res, 'Token inválido', 401);
        }
        logger.error('Error en middleware autenticar:', err);
        return respuestaError(res, 'Error de autenticación', 500);
    }
};

/**
 * Middleware: verifica que el usuario autenticado tenga alguno de los roles permitidos
 * Uso: autorizar('ADMIN', 'OPERADOR')
 */
export const autorizar = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.usuario) {
            return respuestaError(res, 'No autenticado', 401);
        }
        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return respuestaError(res, 'No tienes permiso para realizar esta acción', 403);
        }
        next();
    };
};
