import supabase from '../config/supabase.js';

export const obtenerKPIsDashboard = async () => {
    // Total productos activos
    const { count: totalProductos } = await supabase
        .from('productos').select('*', { count: 'exact', head: true }).eq('activo', true);

    // Valor total inventario
    const { data: dataInventario } = await supabase
        .from('vista_inventario_completo').select('cantidad_disponible, precio_compra_promedio');

    const valorTotalInventario = (dataInventario || []).reduce(
        (acc, i) => acc + (parseFloat(i.cantidad_disponible) * parseFloat(i.precio_compra_promedio)), 0
    );

    // Umbral stock mínimo
    const { data: configUmbral } = await supabase
        .from('configuracion').select('valor').eq('clave', 'stock_minimo_alerta').single();
    const umbral = configUmbral ? parseFloat(configUmbral.valor) : 5;

    // Productos con stock bajo
    const productosStockBajo = (dataInventario || []).filter(
        i => parseFloat(i.cantidad_disponible) < umbral
    ).length;

    // Ingresos mes actual vs mes anterior
    const ahora = new Date();
    const inicioMesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString();
    const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1).toISOString();
    const finMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0).toISOString();

    const { data: ingresosMesActual } = await supabase
        .from('ingresos').select('cantidad, precio_compra_unitario').gte('fecha', inicioMesActual);
    const { data: ingresosMesAnterior } = await supabase
        .from('ingresos').select('cantidad, precio_compra_unitario')
        .gte('fecha', inicioMesAnterior).lte('fecha', finMesAnterior);

    const calcularValorIngresos = (lista) => (lista || []).reduce(
        (acc, i) => acc + (parseFloat(i.cantidad) * parseFloat(i.precio_compra_unitario)), 0
    );

    // Top 5 productos mayor stock
    const { data: top5 } = await supabase
        .from('vista_inventario_completo')
        .select('producto_id, tipo, color, textura, formato, espesor, medida, cantidad_disponible')
        .order('cantidad_disponible', { ascending: false })
        .limit(5);

    return {
        totalProductos,
        valorTotalInventario,
        productosStockBajo,
        umbralStockMinimo: umbral,
        ingresosMesActual: calcularValorIngresos(ingresosMesActual),
        ingresosMesAnterior: calcularValorIngresos(ingresosMesAnterior),
        top5ProductosMayorStock: top5 || []
    };
};
