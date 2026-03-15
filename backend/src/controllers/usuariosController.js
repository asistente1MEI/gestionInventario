import { validationResult } from 'express-validator';
import {
    obtenerUsuarios, crearUsuario, actualizarUsuario, desbloquearUsuario,
    obtenerAuditoriaLogins, obtenerSesionesActivas, revocarSesionRemota,
    obtenerActualizarConfiguracion
} from '../services/usuariosService.js';
import { respuestaExitosa, respuestaError } from '../utils/respuesta.js';

export const listarUsuarios = async (req, res) => {
    try {
        const { datos, paginacion } = await obtenerUsuarios(req.query, req.query);
        return respuestaExitosa(res, datos, 'Usuarios obtenidos', 200, paginacion);
    } catch (err) {
        return respuestaError(res, 'Error al obtener usuarios', 500);
    }
};

export const nuevoUsuario = async (req, res) => {
    try {
        const errores = validationResult(req);
        if (!errores.isEmpty()) return respuestaError(res, 'Datos inválidos', 400, errores.array());
        const usuario = await crearUsuario(req.body);
        return respuestaExitosa(res, usuario, 'Usuario creado', 201);
    } catch (err) {
        if (err.codigo) return respuestaError(res, err.mensaje, err.codigo);
        return respuestaError(res, 'Error al crear usuario', 500);
    }
};

export const editarUsuario = async (req, res) => {
    try {
        const usuario = await actualizarUsuario(req.params.id, req.body);
        return respuestaExitosa(res, usuario, 'Usuario actualizado');
    } catch (err) {
        return respuestaError(res, 'Error al actualizar usuario', 500);
    }
};

export const desbloquearCuentaUsuario = async (req, res) => {
    try {
        const usuario = await desbloquearUsuario(req.params.id);
        return respuestaExitosa(res, usuario, 'Cuenta desbloqueada');
    } catch (err) {
        return respuestaError(res, 'Error al desbloquear usuario', 500);
    }
};

export const auditoria = async (req, res) => {
    try {
        const { datos, paginacion } = await obtenerAuditoriaLogins(req.query, req.query);
        return respuestaExitosa(res, datos, 'Auditoría obtenida', 200, paginacion);
    } catch (err) {
        return respuestaError(res, 'Error al obtener auditoría', 500);
    }
};

export const sesionesActivas = async (req, res) => {
    try {
        const sesiones = await obtenerSesionesActivas();
        return respuestaExitosa(res, sesiones);
    } catch (err) {
        return respuestaError(res, 'Error al obtener sesiones', 500);
    }
};

export const revocarSesion = async (req, res) => {
    try {
        await revocarSesionRemota(req.params.tokenId);
        return respuestaExitosa(res, null, 'Sesión revocada');
    } catch (err) {
        return respuestaError(res, 'Error al revocar sesión', 500);
    }
};

export const obtenerConfiguracion = async (req, res) => {
    try {
        const config = await obtenerActualizarConfiguracion(req.params.clave);
        return respuestaExitosa(res, config);
    } catch (err) {
        return respuestaError(res, 'Error al obtener configuración', 500);
    }
};

export const actualizarConfiguracion = async (req, res) => {
    try {
        const config = await obtenerActualizarConfiguracion(req.params.clave, req.body.valor);
        return respuestaExitosa(res, config, 'Configuración actualizada');
    } catch (err) {
        return respuestaError(res, 'Error al actualizar configuración', 500);
    }
};
