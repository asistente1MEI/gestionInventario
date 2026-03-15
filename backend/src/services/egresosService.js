import supabase from '../config/supabase.js';
import { obtenerPaginacion, metadataPaginacion } from '../utils/respuesta.js';

export const registrarEgreso = async (datosEgreso, usuarioId) => {
    // Validar stock disponible (validación en backend — requisito no negociable)
    const { data: inventario } = await supabase
        .from('inventario')
        .select('cantidad_disponible')
        .eq('producto_id', datosEgreso.producto_id)
        .single();

    if (!inventario) {
        throw { codigo: 404, mensaje: 'Producto sin registro de inventario' };
    }

    if (parseFloat(inventario.cantidad_disponible) < parseFloat(datosEgreso.cantidad)) {
        throw {
            codigo: 422,
            mensaje: `Stock insuficiente. Disponible: ${inventario.cantidad_disponible} unidades`
        };
    }

    const insercion = { ...datosEgreso, usuario_id: usuarioId };

    // El trigger fn_actualizar_inventario_egreso descuenta el stock automáticamente
    const { data, error } = await supabase
        .from('egresos')
        .insert(insercion)
        .select('*, productos(tipo,color,textura,formato,espesor,medida), usuarios(nombre)')
        .single();

    if (error) throw new Error(error.message);
    return data;
};

export const obtenerEgresos = async (filtros, paginacionQuery) => {
    const { pagina, limite, offset } = obtenerPaginacion(paginacionQuery);

    let consulta = supabase
        .from('egresos')
        .select('*, productos(tipo,color,textura,formato,espesor,medida), usuarios(nombre)', { count: 'exact' });

    if (filtros.producto_id) consulta = consulta.eq('producto_id', filtros.producto_id);
    if (filtros.motivo) consulta = consulta.eq('motivo', filtros.motivo);
    if (filtros.fecha_desde) consulta = consulta.gte('fecha', filtros.fecha_desde);
    if (filtros.fecha_hasta) consulta = consulta.lte('fecha', filtros.fecha_hasta);

    consulta = consulta.order('fecha', { ascending: false }).range(offset, offset + limite - 1);

    const { data, error, count } = await consulta;
    if (error) throw new Error(error.message);
    return { datos: data, paginacion: metadataPaginacion(count, pagina, limite) };
};
