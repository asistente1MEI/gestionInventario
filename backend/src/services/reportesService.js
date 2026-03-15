import supabase from '../config/supabase.js';
import { obtenerPaginacion, metadataPaginacion } from '../utils/respuesta.js';

export const obtenerMovimientos = async (filtros, paginacionQuery) => {
    const { pagina, limite, offset } = obtenerPaginacion(paginacionQuery);

    // Construir consulta unificada desde la vista kardex (ya incluye campos del producto en BD)
    let consulta = supabase
        .from('vista_kardex_producto')
        .select('*', { count: 'exact' });

    if (filtros.producto_id) consulta = consulta.eq('producto_id', filtros.producto_id);
    if (filtros.tipo_movimiento) consulta = consulta.eq('tipo_movimiento', filtros.tipo_movimiento);
    if (filtros.fecha_desde) consulta = consulta.gte('fecha', filtros.fecha_desde);
    if (filtros.fecha_hasta) consulta = consulta.lte('fecha', filtros.fecha_hasta);

    consulta = consulta.order('fecha', { ascending: false }).range(offset, offset + limite - 1);

    const { data, error, count } = await consulta;
    if (error) throw new Error(error.message);
    return { datos: data, paginacion: metadataPaginacion(count, pagina, limite) };
};

export const obtenerKardexProducto = async (productoId, paginacionQuery) => {
    const { pagina, limite, offset } = obtenerPaginacion(paginacionQuery);

    const { data, error, count } = await supabase
        .from('vista_kardex_producto')
        .select('*', { count: 'exact' })
        .eq('producto_id', productoId)
        .order('fecha', { ascending: true })
        .range(offset, offset + limite - 1);

    if (error) throw new Error(error.message);

    // Calcular saldo acumulado
    let saldo = 0;
    const conSaldo = (data || []).map(mov => {
        saldo += (parseFloat(mov.cantidad_entrada) || 0) - (parseFloat(mov.cantidad_salida) || 0);
        return { ...mov, saldo_acumulado: saldo };
    });

    return { datos: conSaldo, paginacion: metadataPaginacion(count, pagina, limite) };
};

export const obtenerStockActual = async () => {
    const { data, error } = await supabase
        .from('vista_inventario_completo')
        .select('*')
        .order('tipo', { ascending: true })
        .order('color', { ascending: true });

    if (error) throw new Error(error.message);

    const valorTotal = (data || []).reduce((acc, i) => acc + parseFloat(i.valor_total || 0), 0);

    // Agrupar por tipo
    const agrupado = {};
    (data || []).forEach(item => {
        if (!agrupado[item.tipo]) agrupado[item.tipo] = { items: [], subtotal: 0 };
        agrupado[item.tipo].items.push(item);
        agrupado[item.tipo].subtotal += parseFloat(item.valor_total || 0);
    });

    return { datos: data, agrupado, valorTotal };
};

export const obtenerRotacion = async (filtros) => {
    const fechaDesde = filtros.fecha_desde || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const fechaHasta = filtros.fecha_hasta || new Date().toISOString();

    const { data, error } = await supabase
        .from('vista_kardex_producto')
        .select('producto_id, tipo, color, textura, formato, espesor, medida')
        .gte('fecha', fechaDesde)
        .lte('fecha', fechaHasta);

    if (error) throw new Error(error.message);

    // Contar movimientos por producto conservando su nombre
    const conteo = {};
    (data || []).forEach(row => {
        const pid = row.producto_id;
        if (!conteo[pid]) {
            const desc = row.tipo ? `${row.tipo} — ${row.color} / ${row.textura} / ${row.formato} / ${row.espesor} / ${row.medida}` : pid;
            conteo[pid] = { total: 0, descripcion: desc };
        }
        conteo[pid].total += 1;
    });

    const resultado = Object.entries(conteo)
        .sort(([, a], [, b]) => b.total - a.total)
        .slice(0, 20)
        .map(([producto_id, info]) => ({ 
            producto_id, 
            producto_descripcion: info.descripcion,
            total_movimientos: info.total 
        }));

    return resultado;
};
