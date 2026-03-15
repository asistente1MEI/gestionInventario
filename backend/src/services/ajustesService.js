import supabase from '../config/supabase.js';
import { obtenerPaginacion, metadataPaginacion } from '../utils/respuesta.js';

export const registrarAjuste = async (datosAjuste, usuarioId) => {
    // Obtener cantidad actual
    const { data: inventario } = await supabase
        .from('inventario')
        .select('cantidad_disponible')
        .eq('producto_id', datosAjuste.producto_id)
        .single();

    if (!inventario) {
        throw { codigo: 404, mensaje: 'Producto sin registro de inventario' };
    }

    const cantidadAnterior = parseFloat(inventario.cantidad_disponible);
    const cantidadNueva = parseFloat(datosAjuste.cantidad_nueva);

    if (cantidadNueva < 0) {
        throw { codigo: 400, mensaje: 'La cantidad nueva no puede ser negativa' };
    }

    // El trigger fn_actualizar_inventario_ajuste actualiza el stock automáticamente
    const { data, error } = await supabase
        .from('ajustes_inventario')
        .insert({
            producto_id: datosAjuste.producto_id,
            cantidad_anterior: cantidadAnterior,
            cantidad_nueva: cantidadNueva,
            motivo: datosAjuste.motivo,
            usuario_id: usuarioId
        })
        .select('*, productos(tipo,color,textura,formato,espesor,medida), usuarios(nombre)')
        .single();

    if (error) throw new Error(error.message);
    return data;
};

export const obtenerAjustes = async (filtros, paginacionQuery) => {
    const { pagina, limite, offset } = obtenerPaginacion(paginacionQuery);

    let consulta = supabase
        .from('ajustes_inventario')
        .select('*, productos(tipo,color,textura,formato,espesor,medida), usuarios(nombre)', { count: 'exact' });

    if (filtros.producto_id) consulta = consulta.eq('producto_id', filtros.producto_id);
    if (filtros.fecha_desde) consulta = consulta.gte('fecha', filtros.fecha_desde);
    if (filtros.fecha_hasta) consulta = consulta.lte('fecha', filtros.fecha_hasta);

    consulta = consulta.order('fecha', { ascending: false }).range(offset, offset + limite - 1);

    const { data, error, count } = await consulta;
    if (error) throw new Error(error.message);
    return { datos: data, paginacion: metadataPaginacion(count, pagina, limite) };
};
