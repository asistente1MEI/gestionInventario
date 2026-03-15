import { obtenerMovimientos, obtenerKardexProducto, obtenerStockActual, obtenerRotacion } from '../services/reportesService.js';
import { respuestaExitosa, respuestaError } from '../utils/respuesta.js';

export const movimientos = async (req, res) => {
    try {
        const { datos, paginacion } = await obtenerMovimientos(req.query, req.query);
        return respuestaExitosa(res, datos, 'Movimientos obtenidos', 200, paginacion);
    } catch (err) {
        return respuestaError(res, 'Error al obtener movimientos', 500);
    }
};

export const kardexProducto = async (req, res) => {
    try {
        const { datos, paginacion } = await obtenerKardexProducto(req.params.productoId, req.query);
        return respuestaExitosa(res, datos, 'Kardex obtenido', 200, paginacion);
    } catch (err) {
        return respuestaError(res, 'Error al obtener kardex', 500);
    }
};

export const stockActual = async (req, res) => {
    try {
        const datos = await obtenerStockActual();
        return respuestaExitosa(res, datos, 'Stock actual obtenido');
    } catch (err) {
        return respuestaError(res, 'Error al obtener stock actual', 500);
    }
};

export const rotacion = async (req, res) => {
    try {
        const datos = await obtenerRotacion(req.query);
        return respuestaExitosa(res, datos, 'Reporte de rotación obtenido');
    } catch (err) {
        return respuestaError(res, 'Error al obtener rotación', 500);
    }
};
