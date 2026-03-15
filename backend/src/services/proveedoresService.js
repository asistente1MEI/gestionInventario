import supabase from '../config/supabase.js';
import { obtenerPaginacion, metadataPaginacion } from '../utils/respuesta.js';

export const obtenerProveedores = async (filtros, paginacionQuery) => {
    const { pagina, limite, offset } = obtenerPaginacion(paginacionQuery);

    let consulta = supabase.from('proveedores').select('*', { count: 'exact' });

    if (filtros.busqueda) {
        consulta = consulta.or(`nombre.ilike.%${filtros.busqueda}%,ruc_nit.ilike.%${filtros.busqueda}%,ciudad.ilike.%${filtros.busqueda}%`);
    }
    if (filtros.activo !== undefined) consulta = consulta.eq('activo', filtros.activo === 'true');

    consulta = consulta.order('nombre', { ascending: true }).range(offset, offset + limite - 1);

    const { data, error, count } = await consulta;
    if (error) throw new Error(error.message);

    return { datos: data, paginacion: metadataPaginacion(count, pagina, limite) };
};

export const obtenerProveedorPorId = async (id) => {
    const { data, error } = await supabase.from('proveedores').select('*').eq('id', id).single();
    if (error) throw new Error(error.message);
    return data;
};

export const crearProveedor = async (datosProveedor) => {
    const { data, error } = await supabase.from('proveedores').insert(datosProveedor).select().single();
    if (error) throw new Error(error.message);
    return data;
};

export const actualizarProveedor = async (id, datosProveedor) => {
    const { data, error } = await supabase.from('proveedores').update(datosProveedor).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
};

export const eliminarProveedor = async (id) => {
    const { data, error } = await supabase.from('proveedores').update({ activo: false }).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
};

export const obtenerIngresosDeProveedor = async (proveedorId, paginacionQuery) => {
    const { pagina, limite, offset } = obtenerPaginacion(paginacionQuery);

    const { data, error, count } = await supabase
        .from('ingresos')
        .select('*, productos(tipo, color, textura, formato, espesor, medida), usuarios(nombre)', { count: 'exact' })
        .eq('proveedor_id', proveedorId)
        .order('fecha', { ascending: false })
        .range(offset, offset + limite - 1);

    if (error) throw new Error(error.message);
    return { datos: data, paginacion: metadataPaginacion(count, pagina, limite) };
};
