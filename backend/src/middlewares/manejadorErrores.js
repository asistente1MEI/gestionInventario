import logger from '../config/logger.js';

/**
 * Middleware global de manejo de errores no capturados
 */
const manejadorErrores = (err, req, res, next) => {
    logger.error(`Error no capturado: ${err.message}`, {
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    const codigoHttp = err.status || err.statusCode || 500;
    const mensaje = process.env.NODE_ENV === 'production'
        ? 'Error interno del servidor'
        : err.message || 'Error interno del servidor';

    return res.status(codigoHttp).json({
        success: false,
        message: mensaje,
        data: null
    });
};

export default manejadorErrores;
