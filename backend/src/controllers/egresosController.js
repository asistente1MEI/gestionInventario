import { validationResult } from 'express-validator';
import { registrarEgreso, obtenerEgresos } from '../services/egresosService.js';
import { respuestaExitosa, respuestaError } from '../utils/respuesta.js';

export const listarEgresos = async (req, res) => {
    try {
        const { datos, paginacion } = await obtenerEgresos(req.query, req.query);
        return respuestaExitosa(res, datos, 'Egresos obtenidos', 200, paginacion);
    } catch (err) {
        return respuestaError(res, 'Error al obtener egresos', 500);
    }
};

export const nuevoEgreso = async (req, res) => {
    try {
        const errores = validationResult(req);
        if (!errores.isEmpty()) return respuestaError(res, 'Datos inválidos', 400, errores.array());
        const egreso = await registrarEgreso(req.body, req.usuario.id);
        return respuestaExitosa(res, egreso, 'Egreso registrado', 201);
    } catch (err) {
        if (err.codigo) return respuestaError(res, err.mensaje, err.codigo);
        return respuestaError(res, 'Error al registrar egreso', 500);
    }
};
