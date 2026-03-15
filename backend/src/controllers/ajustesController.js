import { validationResult } from 'express-validator';
import { registrarAjuste, obtenerAjustes } from '../services/ajustesService.js';
import { respuestaExitosa, respuestaError } from '../utils/respuesta.js';

export const listarAjustes = async (req, res) => {
    try {
        const { datos, paginacion } = await obtenerAjustes(req.query, req.query);
        return respuestaExitosa(res, datos, 'Ajustes obtenidos', 200, paginacion);
    } catch (err) {
        return respuestaError(res, 'Error al obtener ajustes', 500);
    }
};

export const nuevoAjuste = async (req, res) => {
    try {
        const errores = validationResult(req);
        if (!errores.isEmpty()) return respuestaError(res, 'Datos inválidos', 400, errores.array());
        const ajuste = await registrarAjuste(req.body, req.usuario.id);
        return respuestaExitosa(res, ajuste, 'Ajuste registrado', 201);
    } catch (err) {
        if (err.codigo) return respuestaError(res, err.mensaje, err.codigo);
        return respuestaError(res, 'Error al registrar ajuste', 500);
    }
};
