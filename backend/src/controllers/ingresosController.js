import { body } from 'express-validator';
import { validationResult } from 'express-validator';
import { registrarIngreso, obtenerIngresos } from '../services/ingresosService.js';
import { respuestaExitosa, respuestaError } from '../utils/respuesta.js';

export const listarIngresos = async (req, res) => {
    try {
        const { datos, paginacion } = await obtenerIngresos(req.query, req.query);
        return respuestaExitosa(res, datos, 'Ingresos obtenidos', 200, paginacion);
    } catch (err) {
        return respuestaError(res, 'Error al obtener ingresos', 500);
    }
};

export const nuevoIngreso = async (req, res) => {
    try {
        const errores = validationResult(req);
        if (!errores.isEmpty()) return respuestaError(res, 'Datos inválidos', 400, errores.array());
        const ingreso = await registrarIngreso(req.body, req.usuario.id);
        return respuestaExitosa(res, ingreso, 'Ingreso registrado', 201);
    } catch (err) {
        if (err.codigo) return respuestaError(res, err.mensaje, err.codigo);
        return respuestaError(res, 'Error al registrar ingreso', 500);
    }
};
