import {
    obtenerProveedores, obtenerProveedorPorId, crearProveedor,
    actualizarProveedor, eliminarProveedor, obtenerIngresosDeProveedor
} from '../services/proveedoresService.js';
import { respuestaExitosa, respuestaError } from '../utils/respuesta.js';

export const listarProveedores = async (req, res) => {
    try {
        const { datos, paginacion } = await obtenerProveedores(req.query, req.query);
        return respuestaExitosa(res, datos, 'Proveedores obtenidos', 200, paginacion);
    } catch (err) {
        return respuestaError(res, 'Error al obtener proveedores', 500);
    }
};

export const obtenerProveedor = async (req, res) => {
    try {
        const proveedor = await obtenerProveedorPorId(req.params.id);
        if (!proveedor) return respuestaError(res, 'Proveedor no encontrado', 404);
        return respuestaExitosa(res, proveedor);
    } catch (err) {
        return respuestaError(res, 'Error al obtener proveedor', 500);
    }
};

export const nuevoProveedor = async (req, res) => {
    try {
        const proveedor = await crearProveedor(req.body);
        return respuestaExitosa(res, proveedor, 'Proveedor creado', 201);
    } catch (err) {
        return respuestaError(res, 'Error al crear proveedor', 500);
    }
};

export const editarProveedor = async (req, res) => {
    try {
        const proveedor = await actualizarProveedor(req.params.id, req.body);
        return respuestaExitosa(res, proveedor, 'Proveedor actualizado');
    } catch (err) {
        return respuestaError(res, 'Error al actualizar proveedor', 500);
    }
};

export const darDeBajaProveedor = async (req, res) => {
    try {
        const proveedor = await eliminarProveedor(req.params.id);
        return respuestaExitosa(res, proveedor, 'Proveedor desactivado');
    } catch (err) {
        return respuestaError(res, 'Error al eliminar proveedor', 500);
    }
};

export const ingresosDeProveedor = async (req, res) => {
    try {
        const { datos, paginacion } = await obtenerIngresosDeProveedor(req.params.id, req.query);
        return respuestaExitosa(res, datos, 'Ingresos del proveedor', 200, paginacion);
    } catch (err) {
        return respuestaError(res, 'Error al obtener ingresos del proveedor', 500);
    }
};
