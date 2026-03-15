/**
 * Genera una respuesta API estandarizada
 */
export const respuestaExitosa = (res, datos, mensaje = 'Operación exitosa', codigoHttp = 200, paginacion = null) => {
    const respuesta = {
        success: true,
        message: mensaje,
        data: datos
    };
    if (paginacion) respuesta.pagination = paginacion;
    return res.status(codigoHttp).json(respuesta);
};

export const respuestaError = (res, mensaje = 'Error interno del servidor', codigoHttp = 500, errores = null) => {
    const respuesta = {
        success: false,
        message: mensaje,
        data: null
    };
    if (errores) respuesta.errors = errores;
    return res.status(codigoHttp).json(respuesta);
};

/**
 * Construye parámetros de paginación desde la query
 */
export const obtenerPaginacion = (query) => {
    const pagina = Math.max(1, parseInt(query.page) || 1);
    const limite = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const offset = (pagina - 1) * limite;
    return { pagina, limite, offset };
};

/**
 * Construye metadata de paginación para la respuesta
 */
export const metadataPaginacion = (total, pagina, limite) => ({
    total,
    page: pagina,
    limit: limite,
    totalPages: Math.ceil(total / limite),
    hasNextPage: pagina * limite < total,
    hasPrevPage: pagina > 1
});
