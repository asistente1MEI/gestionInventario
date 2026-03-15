import { obtenerInventario, obtenerResumenInventario, obtenerAlertasStock } from '../services/inventarioService.js';
import { respuestaExitosa, respuestaError } from '../utils/respuesta.js';

export const listarInventario = async (req, res) => {
    try {
        const { datos, paginacion } = await obtenerInventario(req.query, req.query);
        return respuestaExitosa(res, datos, 'Inventario obtenido', 200, paginacion);
    } catch (err) {
        return respuestaError(res, 'Error al obtener inventario', 500);
    }
};

export const resumenInventario = async (req, res) => {
    try {
        const resumen = await obtenerResumenInventario();
        return respuestaExitosa(res, resumen);
    } catch (err) {
        return respuestaError(res, 'Error al obtener resumen', 500);
    }
};

export const alertasStock = async (req, res) => {
    try {
        const resultado = await obtenerAlertasStock();
        return respuestaExitosa(res, resultado);
    } catch (err) {
        return respuestaError(res, 'Error al obtener alertas de stock', 500);
    }
};
