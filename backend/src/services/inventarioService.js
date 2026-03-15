import supabase from '../config/supabase.js';
import { obtenerPaginacion, metadataPaginacion } from '../utils/respuesta.js';

export const obtenerInventario = async (filtros, paginacionQuery) => {
    const { pagina, limite, offset } = obtenerPaginacion(paginacionQuery);

    let consulta = supabase
        .from('vista_inventario_completo')
        .select('*', { count: 'exact' });

    if (filtros.tipo) consulta = consulta.eq('tipo', filtros.tipo);
    if (filtros.color) consulta = consulta.ilike('color', `%${filtros.color}%`);
    if (filtros.textura) consulta = consulta.ilike('textura', `%${filtros.textura}%`);
    if (filtros.formato) consulta = consulta.ilike('formato', `%${filtros.formato}%`);
    if (filtros.espesor) consulta = consulta.ilike('espesor', `%${filtros.espesor}%`);
    if (filtros.medida) consulta = consulta.ilike('medida', `%${filtros.medida}%`);
    if (filtros.busqueda) {
        consulta = consulta.or(`color.ilike.%${filtros.busqueda}%,textura.ilike.%${filtros.busqueda}%,formato.ilike.%${filtros.busqueda}%`);
    }
    if (filtros.stock_bajo) {
        const umbral = parseFloat(filtros.stock_bajo) || 5;
        consulta = consulta.lt('cantidad_disponible', umbral);
    }

    consulta = consulta.order('tipo', { ascending: true }).order('color', { ascending: true }).range(offset, offset + limite - 1);

    const { data, error, count } = await consulta;
    if (error) throw new Error(error.message);

    return { datos: data, paginacion: metadataPaginacion(count, pagina, limite) };
};

export const obtenerResumenInventario = async () => {
    const { data, error } = await supabase
        .from('configuracion')
        .select('valor')
        .eq('clave', 'stock_minimo_alerta')
        .single();

    const umbral = data ? parseFloat(data.valor) : 5;

    const { data: inventario, error: errorInv } = await supabase
        .from('vista_inventario_completo')
        .select('cantidad_disponible, valor_total');

    if (errorInv) throw new Error(errorInv.message);

    const totalProductos = inventario.length;
    const valorTotal = inventario.reduce((acc, item) => acc + (parseFloat(item.valor_total) || 0), 0);
    const productosStockBajo = inventario.filter(i => parseFloat(i.cantidad_disponible) < umbral).length;

    return { totalProductos, valorTotal, productosStockBajo, umbralStockMinimo: umbral };
};

export const obtenerAlertasStock = async () => {
    // Obtener umbral dinámico de configuración
    const { data: config } = await supabase
        .from('configuracion')
        .select('valor')
        .eq('clave', 'stock_minimo_alerta')
        .single();

    const umbral = config ? parseFloat(config.valor) : 5;

    const { data, error } = await supabase
        .from('vista_inventario_completo')
        .select('producto_id, tipo, color, textura, formato, espesor, medida, cantidad_disponible')
        .lt('cantidad_disponible', umbral)
        .order('cantidad_disponible', { ascending: true });

    if (error) throw new Error(error.message);

    return { alertas: data || [], umbral };
};
