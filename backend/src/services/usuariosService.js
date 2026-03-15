import bcrypt from 'bcryptjs';
import supabase from '../config/supabase.js';
import { obtenerPaginacion, metadataPaginacion } from '../utils/respuesta.js';

const SALT_ROUNDS = 12;

export const obtenerUsuarios = async (filtros, paginacionQuery) => {
    const { pagina, limite, offset } = obtenerPaginacion(paginacionQuery);

    let consulta = supabase
        .from('usuarios')
        .select('id, nombre, email, rol, activo, forzar_cambio_password, intentos_fallidos, bloqueado_hasta, created_at', { count: 'exact' });

    if (filtros.rol) consulta = consulta.eq('rol', filtros.rol);
    if (filtros.activo !== undefined) consulta = consulta.eq('activo', filtros.activo === 'true');
    if (filtros.busqueda) consulta = consulta.or(`nombre.ilike.%${filtros.busqueda}%,email.ilike.%${filtros.busqueda}%`);

    consulta = consulta.order('created_at', { ascending: false }).range(offset, offset + limite - 1);

    const { data, error, count } = await consulta;
    if (error) throw new Error(error.message);
    return { datos: data, paginacion: metadataPaginacion(count, pagina, limite) };
};

export const crearUsuario = async ({ nombre, email, password, rol }) => {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const { data, error } = await supabase
        .from('usuarios')
        .insert({ nombre, email: email.toLowerCase().trim(), password_hash: passwordHash, rol, forzar_cambio_password: true })
        .select('id, nombre, email, rol, activo, forzar_cambio_password, created_at')
        .single();

    if (error) {
        if (error.code === '23505') throw { codigo: 409, mensaje: 'El email ya está registrado' };
        throw new Error(error.message);
    }
    return data;
};

export const actualizarUsuario = async (id, datos) => {
    const actualizacion = {};
    if (datos.nombre) actualizacion.nombre = datos.nombre;
    if (datos.rol) actualizacion.rol = datos.rol;
    if (datos.activo !== undefined) actualizacion.activo = datos.activo;
    if (datos.password) actualizacion.password_hash = await bcrypt.hash(datos.password, SALT_ROUNDS);
    if (datos.forzar_cambio_password !== undefined) actualizacion.forzar_cambio_password = datos.forzar_cambio_password;

    const { data, error } = await supabase
        .from('usuarios')
        .update(actualizacion)
        .eq('id', id)
        .select('id, nombre, email, rol, activo, forzar_cambio_password')
        .single();

    if (error) throw new Error(error.message);
    return data;
};

export const desbloquearUsuario = async (id) => {
    const { data, error } = await supabase
        .from('usuarios')
        .update({ intentos_fallidos: 0, bloqueado_hasta: null })
        .eq('id', id)
        .select('id, nombre, email, rol')
        .single();

    if (error) throw new Error(error.message);
    return data;
};

export const obtenerAuditoriaLogins = async (filtros, paginacionQuery) => {
    const { pagina, limite, offset } = obtenerPaginacion(paginacionQuery);

    let consulta = supabase
        .from('auditoria_logins')
        .select('*, usuarios(nombre, email)', { count: 'exact' });

    if (filtros.usuario_id) consulta = consulta.eq('usuario_id', filtros.usuario_id);
    if (filtros.exitoso !== undefined) consulta = consulta.eq('exitoso', filtros.exitoso === 'true');
    if (filtros.fecha_desde) consulta = consulta.gte('fecha', filtros.fecha_desde);
    if (filtros.fecha_hasta) consulta = consulta.lte('fecha', filtros.fecha_hasta);

    consulta = consulta.order('fecha', { ascending: false }).range(offset, offset + limite - 1);

    const { data, error, count } = await consulta;
    if (error) throw new Error(error.message);
    return { datos: data, paginacion: metadataPaginacion(count, pagina, limite) };
};

export const obtenerSesionesActivas = async () => {
    const { data, error } = await supabase
        .from('refresh_tokens')
        .select('id, usuario_id, expira_en, created_at, usuarios(nombre, email)')
        .eq('revocado', false)
        .gt('expira_en', new Date().toISOString())
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
};

export const revocarSesionRemota = async (tokenId) => {
    const { error } = await supabase
        .from('refresh_tokens')
        .update({ revocado: true })
        .eq('id', tokenId);

    if (error) throw new Error(error.message);
};

export const obtenerActualizarConfiguracion = async (clave, valor) => {
    if (valor !== undefined) {
        const { data, error } = await supabase
            .from('configuracion')
            .upsert({ clave, valor, updated_at: new Date().toISOString() })
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    } else {
        const { data, error } = await supabase
            .from('configuracion')
            .select('*')
            .eq('clave', clave)
            .single();
        if (error) throw new Error(error.message);
        return data;
    }
};
