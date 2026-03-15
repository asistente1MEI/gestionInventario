import { validationResult } from 'express-validator';
import {
    servicioLogin,
    servicioRefrescarToken,
    servicioLogout,
    servicioOlvidePassword,
    servicioResetPassword,
    servicioCambiarPassword
} from '../services/authService.js';
import { respuestaExitosa, respuestaError } from '../utils/respuesta.js';

const OPCIONES_REFRESH_COOKIE = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax',
    maxAge: (parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS) || 7) * 24 * 60 * 60 * 1000
};

export const login = async (req, res) => {
    try {
        const errores = validationResult(req);
        if (!errores.isEmpty()) {
            return respuestaError(res, 'Datos inválidos', 400, errores.array());
        }

        const { email, password } = req.body;
        const ip = req.ip || req.headers['x-forwarded-for'];
        const userAgent = req.headers['user-agent'];

        const resultado = await servicioLogin({ email, password, ip, userAgent });

        if (resultado.error) {
            const respuesta = { message: resultado.error };
            if (resultado.intentosRestantes !== null && resultado.intentosRestantes !== undefined) {
                respuesta.intentosRestantes = resultado.intentosRestantes;
            }
            return res.status(401).json({ success: false, ...respuesta, data: null });
        }

        res.cookie('refreshToken', resultado.refreshToken, OPCIONES_REFRESH_COOKIE);

        return respuestaExitosa(res, {
            accessToken: resultado.accessToken,
            usuario: resultado.usuario
        }, 'Sesión iniciada correctamente');
    } catch (err) {
        return respuestaError(res, 'Error al iniciar sesión', 500);
    }
};

export const refrescarToken = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        const resultado = await servicioRefrescarToken(refreshToken);

        if (resultado.error) {
            res.clearCookie('refreshToken');
            return respuestaError(res, resultado.error, 401);
        }

        res.cookie('refreshToken', resultado.refreshToken, OPCIONES_REFRESH_COOKIE);
        return respuestaExitosa(res, { accessToken: resultado.accessToken }, 'Token renovado');
    } catch (err) {
        return respuestaError(res, 'Error al renovar token', 500);
    }
};

export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        await servicioLogout(refreshToken);
        res.clearCookie('refreshToken');
        return respuestaExitosa(res, null, 'Sesión cerrada correctamente');
    } catch (err) {
        return respuestaError(res, 'Error al cerrar sesión', 500);
    }
};

export const olvideMiPassword = async (req, res) => {
    try {
        const errores = validationResult(req);
        if (!errores.isEmpty()) {
            return respuestaError(res, 'Email inválido', 400, errores.array());
        }
        const { email } = req.body;
        await servicioOlvidePassword(email);
        // Siempre responder igual para no revelar si el email existe
        return respuestaExitosa(res, null, 'Si el email existe recibirás las instrucciones de recuperación');
    } catch (err) {
        return respuestaError(res, 'Error al procesar la solicitud', 500);
    }
};

export const resetPassword = async (req, res) => {
    try {
        const errores = validationResult(req);
        if (!errores.isEmpty()) {
            return respuestaError(res, 'Datos inválidos', 400, errores.array());
        }
        const { token, nueva_password } = req.body;
        const resultado = await servicioResetPassword(token, nueva_password);

        if (resultado.error) return respuestaError(res, resultado.error, 400);
        return respuestaExitosa(res, null, 'Contraseña actualizada correctamente');
    } catch (err) {
        return respuestaError(res, 'Error al resetear contraseña', 500);
    }
};

export const cambiarPassword = async (req, res) => {
    try {
        const errores = validationResult(req);
        if (!errores.isEmpty()) {
            return respuestaError(res, 'Datos inválidos', 400, errores.array());
        }
        const { password_actual, nueva_password } = req.body;
        const resultado = await servicioCambiarPassword(req.usuario.id, password_actual, nueva_password);

        if (resultado.error) return respuestaError(res, resultado.error, 400);
        return respuestaExitosa(res, null, 'Contraseña cambiada correctamente');
    } catch (err) {
        return respuestaError(res, 'Error al cambiar contraseña', 500);
    }
};

export const obtenerPerfil = async (req, res) => {
    try {
        return respuestaExitosa(res, req.usuario, 'Perfil obtenido');
    } catch (err) {
        return respuestaError(res, 'Error al obtener perfil', 500);
    }
};
