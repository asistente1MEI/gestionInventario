import supabase from '../config/supabase.js';
import { obtenerPaginacion, metadataPaginacion } from '../utils/respuesta.js';

export const registrarIngreso = async (datosIngreso, usuarioId) => {
    // Verificar que el producto existe y está activo
    const { data: producto } = await supabase
        .from('productos')
        .select('id, activo')
        .eq('id', datosIngreso.producto_id)
        .single();

    if (!producto || !producto.activo) {
        throw { codigo: 404, mensaje: 'Producto no encontrado o inactivo' };
    }

    const insercion = {
        ...datosIngreso,
        usuario_id: usuarioId
    };

    // El trigger fn_actualizar_inventario_ingreso actualiza el stock automáticamente
    const { data, error } = await supabase
        .from('ingresos')
        .insert(insercion)
        .select('*, productos(tipo,color,textura,formato,espesor,medida), proveedores(nombre), usuarios(nombre)')
        .single();

    if (error) throw new Error(error.message);
    return data;
};

export const obtenerIngresos = async (filtros, paginacionQuery) => {
    const { pagina, limite, offset } = obtenerPaginacion(paginacionQuery);

    let consulta = supabase
        .from('ingresos')
        .select('*, productos(tipo,color,textura,formato,espesor,medida), proveedores(nombre), usuarios(nombre)', { count: 'exact' });

    if (filtros.producto_id) consulta = consulta.eq('producto_id', filtros.producto_id);
    if (filtros.proveedor_id) consulta = consulta.eq('proveedor_id', filtros.proveedor_id);
    if (filtros.fecha_desde) consulta = consulta.gte('fecha', filtros.fecha_desde);
    if (filtros.fecha_hasta) consulta = consulta.lte('fecha', filtros.fecha_hasta);
    if (filtros.numero_factura) consulta = consulta.ilike('numero_factura', `%${filtros.numero_factura}%`);

    consulta = consulta.order('fecha', { ascending: false }).range(offset, offset + limite - 1);

    const { data, error, count } = await consulta;
    if (error) throw new Error(error.message);
    return { datos: data, paginacion: metadataPaginacion(count, pagina, limite) };
};
