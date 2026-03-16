import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import supabase from '../config/supabase.js';
import logger from '../config/logger.js';
import {
    enviarCorreoResetPassword,
    enviarConfirmacionPasswordRestablecida,
    enviarNotificacionBloqueo
} from './emailService.js';

const SALT_ROUNDS = 12;
const MAX_INTENTOS = 5;
const BLOQUEO_MINUTOS = 30;
const REFRESH_TOKEN_DIAS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS) || 7;

// ── Helpers internos ────────────────────────────────────────────────────

const generarAccessToken = (usuarioId, rol) => {
    return jwt.sign(
        { usuarioId, rol },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '4h' }
    );
};

const generarRefreshTokenOpaco = () => {
    return crypto.randomBytes(64).toString('hex');
};

const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

// ── Servicio: Login ────────────────────────────────────────────────────

export const servicioLogin = async ({ email, password, ip, userAgent }) => {
    // 1. Buscar usuario por email
    const { data: usuario, error: errorBusqueda } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single();

    if (errorBusqueda || !usuario) {
        await registrarAuditoria(null, ip, userAgent, false, 'Usuario no encontrado');
        return { error: 'Credenciales incorrectas', intentosRestantes: null };
    }

    // 2. Verificar que el usuario esté activo
    if (!usuario.activo) {
        await registrarAuditoria(usuario.id, ip, userAgent, false, 'Cuenta desactivada');
        return { error: 'Cuenta desactivada. Contacta al administrador', intentosRestantes: null };
    }

    // 3. Verificar bloqueo por intentos fallidos
    if (usuario.bloqueado_hasta && new Date(usuario.bloqueado_hasta) > new Date()) {
        const minutosRestantes = Math.ceil((new Date(usuario.bloqueado_hasta) - new Date()) / 60000);
        await registrarAuditoria(usuario.id, ip, userAgent, false, 'Cuenta bloqueada');
        return { error: `Cuenta bloqueada. Intenta de nuevo en ${minutosRestantes} minuto(s)`, intentosRestantes: 0 };
    }

    // 4. Validar contraseña
    const passwordValida = await bcrypt.compare(password, usuario.password_hash);

    if (!passwordValida) {
        const nuevosIntentos = (usuario.intentos_fallidos || 0) + 1;
        const actualizacion = { intentos_fallidos: nuevosIntentos };

        if (nuevosIntentos >= MAX_INTENTOS) {
            actualizacion.bloqueado_hasta = new Date(Date.now() + BLOQUEO_MINUTOS * 60 * 1000).toISOString();
            // Notificar al usuario que su cuenta fue bloqueada
            enviarNotificacionBloqueo(usuario.email, usuario.nombre, ip).catch(() => {});
        }

        await supabase.from('usuarios').update(actualizacion).eq('id', usuario.id);
        await registrarAuditoria(usuario.id, ip, userAgent, false, 'Contraseña incorrecta');

        const intentosRestantes = Math.max(0, MAX_INTENTOS - nuevosIntentos);
        return { error: 'Credenciales incorrectas', intentosRestantes };
    }

    // 5. Login exitoso — resetear intentos fallidos
    await supabase.from('usuarios').update({
        intentos_fallidos: 0,
        bloqueado_hasta: null
    }).eq('id', usuario.id);

    await registrarAuditoria(usuario.id, ip, userAgent, true, null);

    // 6. Generar tokens
    const accessToken = generarAccessToken(usuario.id, usuario.rol);
    const refreshTokenOpaco = generarRefreshTokenOpaco();
    const refreshTokenHash = hashToken(refreshTokenOpaco);
    const expiraEn = new Date(Date.now() + REFRESH_TOKEN_DIAS * 24 * 60 * 60 * 1000).toISOString();

    await supabase.from('refresh_tokens').insert({
        usuario_id: usuario.id,
        token_hash: refreshTokenHash,
        expira_en: expiraEn,
        revocado: false
    });

    return {
        accessToken,
        refreshToken: refreshTokenOpaco,
        usuario: {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
            forzarCambioPassword: usuario.forzar_cambio_password
        }
    };
};

// ── Servicio: Refresh Token ────────────────────────────────────────────

export const servicioRefrescarToken = async (refreshTokenOpaco) => {
    if (!refreshTokenOpaco) {
        return { error: 'Refresh token requerido' };
    }

    const tokenHash = hashToken(refreshTokenOpaco);

    const { data: tokenGuardado, error } = await supabase
        .from('refresh_tokens')
        .select('*, usuarios(id, rol, activo)')
        .eq('token_hash', tokenHash)
        .single();

    if (error || !tokenGuardado) {
        return { error: 'Refresh token inválido' };
    }

    // Detectar reuso (token ya revocado = posible robo)
    if (tokenGuardado.revocado) {
        // Revocar TODOS los tokens del usuario como medida de seguridad
        await supabase.from('refresh_tokens')
            .update({ revocado: true })
            .eq('usuario_id', tokenGuardado.usuario_id);
        logger.warn(`Detección de reuso de refresh token para usuario ${tokenGuardado.usuario_id}`);
        return { error: 'Sesión inválida. Inicia sesión nuevamente' };
    }

    if (new Date(tokenGuardado.expira_en) < new Date()) {
        return { error: 'Sesión expirada. Inicia sesión nuevamente' };
    }

    if (!tokenGuardado.usuarios.activo) {
        return { error: 'Cuenta desactivada' };
    }

    // Revocar token actual (rotación)
    await supabase.from('refresh_tokens').update({ revocado: true }).eq('id', tokenGuardado.id);

    // Emitir tokens nuevos
    const nuevoAccessToken = generarAccessToken(tokenGuardado.usuarios.id, tokenGuardado.usuarios.rol);
    const nuevoRefreshOpaco = generarRefreshTokenOpaco();
    const nuevoHash = hashToken(nuevoRefreshOpaco);
    const nuevaExpiracion = new Date(Date.now() + REFRESH_TOKEN_DIAS * 24 * 60 * 60 * 1000).toISOString();

    await supabase.from('refresh_tokens').insert({
        usuario_id: tokenGuardado.usuarios.id,
        token_hash: nuevoHash,
        expira_en: nuevaExpiracion,
        revocado: false
    });

    return { accessToken: nuevoAccessToken, refreshToken: nuevoRefreshOpaco };
};

// ── Servicio: Logout ───────────────────────────────────────────────────

export const servicioLogout = async (refreshTokenOpaco) => {
    if (!refreshTokenOpaco) return;
    const tokenHash = hashToken(refreshTokenOpaco);
    await supabase.from('refresh_tokens').update({ revocado: true }).eq('token_hash', tokenHash);
};

// ── Servicio: Olvidé mi contraseña ────────────────────────────────────

export const servicioOlvidePassword = async (email) => {
    const { data: usuario } = await supabase
        .from('usuarios')
        .select('id, nombre, email')
        .eq('email', email.toLowerCase().trim())
        .eq('activo', true)
        .single();

    // No revelar si el email existe o no (seguridad)
    if (!usuario) return { ok: true };

    const tokenOpaco = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(tokenOpaco);
    const expiraEn = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hora

    // Invalidar tokens anteriores del usuario
    await supabase.from('password_reset_tokens')
        .update({ usado: true })
        .eq('usuario_id', usuario.id)
        .eq('usado', false);

    await supabase.from('password_reset_tokens').insert({
        usuario_id: usuario.id,
        token_hash: tokenHash,
        expira_en: expiraEn,
        usado: false
    });

    // Enviar el correo de recuperación via Resend
    await enviarCorreoResetPassword(usuario.email, usuario.nombre, tokenOpaco);

    return { ok: true };
};

// ── Servicio: Resetear contraseña ─────────────────────────────────────

export const servicioResetPassword = async (tokenOpaco, nuevaPassword) => {
    const tokenHash = hashToken(tokenOpaco);

    const { data: tokenGuardado, error } = await supabase
        .from('password_reset_tokens')
        .select('*, usuarios(id, password_hash)')
        .eq('token_hash', tokenHash)
        .eq('usado', false)
        .single();

    if (error || !tokenGuardado) {
        return { error: 'Token inválido o ya utilizado' };
    }

    if (new Date(tokenGuardado.expira_en) < new Date()) {
        return { error: 'El enlace de recuperación ha expirado' };
    }

    // No puede ser la misma contraseña anterior
    const esMismaPassword = await bcrypt.compare(nuevaPassword, tokenGuardado.usuarios.password_hash);
    if (esMismaPassword) {
        return { error: 'La nueva contraseña no puede ser igual a la anterior' };
    }

    const nuevoHash = await bcrypt.hash(nuevaPassword, SALT_ROUNDS);

    await supabase.from('usuarios').update({
        password_hash: nuevoHash,
        forzar_cambio_password: false,
        intentos_fallidos: 0,
        bloqueado_hasta: null
    }).eq('id', tokenGuardado.usuario_id);

    await supabase.from('password_reset_tokens').update({ usado: true }).eq('id', tokenGuardado.id);

    // Revocar todos los refresh tokens activos del usuario
    await supabase.from('refresh_tokens').update({ revocado: true }).eq('usuario_id', tokenGuardado.usuario_id);

    // Notificar que la contraseña fue restablecida exitosamente
    const { data: usuarioDatos } = await supabase
        .from('usuarios')
        .select('nombre, email')
        .eq('id', tokenGuardado.usuario_id)
        .single();
    if (usuarioDatos) {
        enviarConfirmacionPasswordRestablecida(usuarioDatos.email, usuarioDatos.nombre).catch(() => {});
    }

    return { ok: true };
};

// ── Servicio: Cambio obligatorio de contraseña ────────────────────────

export const servicioCambiarPassword = async (usuarioId, passwordActual, nuevaPassword) => {
    const { data: usuario } = await supabase
        .from('usuarios')
        .select('password_hash')
        .eq('id', usuarioId)
        .single();

    if (!usuario) return { error: 'Usuario no encontrado' };

    const passwordValida = await bcrypt.compare(passwordActual, usuario.password_hash);
    if (!passwordValida) return { error: 'Contraseña actual incorrecta' };

    const esMismaPassword = await bcrypt.compare(nuevaPassword, usuario.password_hash);
    if (esMismaPassword) return { error: 'La nueva contraseña no puede ser igual a la actual' };

    const nuevoHash = await bcrypt.hash(nuevaPassword, SALT_ROUNDS);

    await supabase.from('usuarios').update({
        password_hash: nuevoHash,
        forzar_cambio_password: false,
        intentos_fallidos: 0,
        bloqueado_hasta: null
    }).eq('id', usuarioId);

    return { ok: true };
};

// ── Helper: Registrar auditoría de login ──────────────────────────────

const registrarAuditoria = async (usuarioId, ip, userAgent, exitoso, motivoFallo) => {
    try {
        await supabase.from('auditoria_logins').insert({
            usuario_id: usuarioId,
            ip,
            user_agent: userAgent,
            exitoso,
            motivo_fallo: motivoFallo
        });
    } catch (err) {
        logger.error('Error registrando auditoría de login:', err.message);
    }
};
