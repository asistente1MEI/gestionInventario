import supabase from '../config/supabase.js';
import { obtenerPaginacion, metadataPaginacion } from '../utils/respuesta.js';

export const obtenerProductos = async (filtros, paginacionQuery) => {
    const { pagina, limite, offset } = obtenerPaginacion(paginacionQuery);

    let consulta = supabase
        .from('productos')
        .select('*', { count: 'exact' });

    // Filtros dinámicos
    if (filtros.tipo) consulta = consulta.eq('tipo', filtros.tipo);
    if (filtros.color) consulta = consulta.ilike('color', `%${filtros.color}%`);
    if (filtros.textura) consulta = consulta.ilike('textura', `%${filtros.textura}%`);
    if (filtros.formato) consulta = consulta.ilike('formato', `%${filtros.formato}%`);
    if (filtros.espesor) consulta = consulta.ilike('espesor', `%${filtros.espesor}%`);
    if (filtros.medida) consulta = consulta.ilike('medida', `%${filtros.medida}%`);
    if (filtros.busqueda) {
        consulta = consulta.or(`color.ilike.%${filtros.busqueda}%,textura.ilike.%${filtros.busqueda}%,formato.ilike.%${filtros.busqueda}%`);
    }
    if (filtros.activo !== undefined) consulta = consulta.eq('activo', filtros.activo === 'true');

    consulta = consulta.order('created_at', { ascending: false }).range(offset, offset + limite - 1);

    const { data, error, count } = await consulta;
    if (error) throw new Error(error.message);

    return { datos: data, paginacion: metadataPaginacion(count, pagina, limite) };
};

export const obtenerProductoPorId = async (id) => {
    const { data, error } = await supabase.from('productos').select('*').eq('id', id).single();
    if (error) throw new Error(error.message);
    return data;
};

export const crearProducto = async (datosProducto) => {
    const { data, error } = await supabase
        .from('productos')
        .insert(datosProducto)
        .select()
        .single();

    if (error) {
        if (error.code === '23505') throw { codigo: 409, mensaje: 'Ya existe un producto con esas características' };
        throw new Error(error.message);
    }

    // Crear registro de inventario inicial en 0
    await supabase.from('inventario').insert({
        producto_id: data.id,
        cantidad_disponible: 0,
        precio_compra_promedio: 0
    });

    return data;
};

export const actualizarProducto = async (id, datosProducto) => {
    const { data, error } = await supabase
        .from('productos')
        .update(datosProducto)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        if (error.code === '23505') throw { codigo: 409, mensaje: 'Ya existe un producto con esas características' };
        throw new Error(error.message);
    }
    return data;
};

export const eliminarProducto = async (id) => {
    // Baja lógica
    const { data, error } = await supabase
        .from('productos')
        .update({ activo: false })
        .eq('id', id)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
};

export const activarProducto = async (id) => {
    // Alta lógica
    const { data, error } = await supabase
        .from('productos')
        .update({ activo: true })
        .eq('id', id)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
};

export const obtenerValoresFiltros = async () => {
    const { data, error } = await supabase
        .from('productos')
        .select('tipo, color, textura, formato, espesor, medida')
        .eq('activo', true);

    if (error) throw new Error(error.message);

    const unico = (campo) => [...new Set(data.map(p => p[campo]).filter(Boolean))].sort();

    return {
        tipos: unico('tipo'),
        colores: unico('color'),
        texturas: unico('textura'),
        formatos: unico('formato'),
        espesores: unico('espesor'),
        medidas: unico('medida')
    };
};

const TIPOS_VALIDOS = ['LAMINA', 'FONDO'];
const CAMPOS_REQUERIDOS = ['tipo', 'color', 'textura', 'formato', 'espesor', 'medida'];

export const cargaMasivaProductos = async (filas) => {
    let creados = 0;
    let omitidos = 0;  // duplicados ignorados
    const errores = [];

    for (let i = 0; i < filas.length; i++) {
        const fila = filas[i];
        const numFila = i + 2; // +2 porque la fila 1 es el encabezado

        // Validar campos requeridos
        const faltantes = CAMPOS_REQUERIDOS.filter(c => !fila[c] || String(fila[c]).trim() === '');
        if (faltantes.length) {
            errores.push({ fila: numFila, motivo: `Campos requeridos faltantes: ${faltantes.join(', ')}` });
            continue;
        }

        // Normalizar a mayúsculas
        const productoLimpio = {
            tipo: String(fila.tipo).trim().toUpperCase(),
            color: String(fila.color).trim().toUpperCase(),
            textura: String(fila.textura).trim().toUpperCase(),
            formato: String(fila.formato).trim().toUpperCase(),
            espesor: String(fila.espesor).trim().toUpperCase(),
            medida: String(fila.medida).trim().toUpperCase(),
            unidad_medida: fila.unidad_medida ? String(fila.unidad_medida).trim().toUpperCase() : 'UNIDAD',
        };

        if (!TIPOS_VALIDOS.includes(productoLimpio.tipo)) {
            errores.push({ fila: numFila, motivo: `Tipo inválido: "${productoLimpio.tipo}". Debe ser LAMINA o FONDO` });
            continue;
        }

        const { data, error } = await supabase
            .from('productos')
            .insert(productoLimpio)
            .select('id')
            .single();

        if (error) {
            if (error.code === '23505') {
                omitidos++;  // Producto duplicado — se ignora silenciosamente
            } else {
                errores.push({ fila: numFila, motivo: error.message });
            }
            continue;
        }

        // Crear registro de inventario inicial (cantidad y precio opcionales)
        const cantidadInicial = parseFloat(fila.cantidad_inicial) || 0;
        const precioInicial = parseFloat(fila.precio) || parseFloat(fila.precio_compra) || 0;
        await supabase.from('inventario').insert({
            producto_id: data.id,
            cantidad_disponible: cantidadInicial >= 0 ? cantidadInicial : 0,
            precio_compra_promedio: precioInicial >= 0 ? precioInicial : 0
        });
        creados++;
    }

    return { creados, omitidos, errores, total: filas.length };
};
