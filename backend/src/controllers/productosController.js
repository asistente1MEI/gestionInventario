import { validationResult } from 'express-validator';
import {
    obtenerProductos, obtenerProductoPorId, crearProducto,
    actualizarProducto, eliminarProducto, obtenerValoresFiltros,
    cargaMasivaProductos
} from '../services/productosService.js';
import { respuestaExitosa, respuestaError } from '../utils/respuesta.js';

export const listarProductos = async (req, res) => {
    try {
        const { datos, paginacion } = await obtenerProductos(req.query, req.query);
        return respuestaExitosa(res, datos, 'Productos obtenidos', 200, paginacion);
    } catch (err) {
        return respuestaError(res, 'Error al obtener productos', 500);
    }
};

export const obtenerProducto = async (req, res) => {
    try {
        const producto = await obtenerProductoPorId(req.params.id);
        if (!producto) return respuestaError(res, 'Producto no encontrado', 404);
        return respuestaExitosa(res, producto);
    } catch (err) {
        return respuestaError(res, 'Error al obtener producto', 500);
    }
};

export const nuevoProduto = async (req, res) => {
    try {
        const errores = validationResult(req);
        if (!errores.isEmpty()) return respuestaError(res, 'Datos inválidos', 400, errores.array());
        const producto = await crearProducto(req.body);
        return respuestaExitosa(res, producto, 'Producto creado', 201);
    } catch (err) {
        if (err.codigo) return respuestaError(res, err.mensaje, err.codigo);
        return respuestaError(res, 'Error al crear producto', 500);
    }
};

export const editarProducto = async (req, res) => {
    try {
        const producto = await actualizarProducto(req.params.id, req.body);
        return respuestaExitosa(res, producto, 'Producto actualizado');
    } catch (err) {
        if (err.codigo) return respuestaError(res, err.mensaje, err.codigo);
        return respuestaError(res, 'Error al actualizar producto', 500);
    }
};

export const darDeBajaProducto = async (req, res) => {
    try {
        const producto = await eliminarProducto(req.params.id);
        return respuestaExitosa(res, producto, 'Producto desactivado');
    } catch (err) {
        return respuestaError(res, 'Error al eliminar producto', 500);
    }
};

export const filtrosDisponibles = async (req, res) => {
    try {
        const filtros = await obtenerValoresFiltros();
        return respuestaExitosa(res, filtros);
    } catch (err) {
        return respuestaError(res, 'Error al obtener filtros', 500);
    }
};

export const importarProductos = async (req, res) => {
    try {
        const filas = req.body;
        if (!Array.isArray(filas) || filas.length === 0) {
            return respuestaError(res, 'Se requiere un arreglo de productos', 400);
        }
        if (filas.length > 1000) {
            return respuestaError(res, 'Máximo 1000 productos por carga', 400);
        }
        const resultado = await cargaMasivaProductos(filas);
        return respuestaExitosa(res, resultado, `Carga completada: ${resultado.creados} creados, ${resultado.omitidos} duplicados omitidos`, 200);
    } catch (err) {
        return respuestaError(res, 'Error en la carga masiva', 500);
    }
};
