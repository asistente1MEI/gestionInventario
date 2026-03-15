/**
 * Script de semilla — Crear / actualizar usuario admin inicial
 * Uso: node scripts/crearAdmin.js
 *
 * Requiere que .env esté configurado con SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const EMAIL_ADMIN    = 'admin@mei.com';
const PASSWORD_TEMP  = 'Admin1234!';
const NOMBRE_ADMIN   = 'Administrador MEI';

const main = async () => {
    console.log('Generando hash de contraseña...');
    const passwordHash = await bcrypt.hash(PASSWORD_TEMP, 12);
    console.log('Hash generado:', passwordHash);

    // Verificar que el hash es correcto antes de guardarlo
    const verificacion = await bcrypt.compare(PASSWORD_TEMP, passwordHash);
    if (!verificacion) {
        console.error('ERROR: el hash no coincide con la contraseña. Abortando.');
        process.exit(1);
    }
    console.log('Verificacion del hash: OK');

    // Ver si el usuario ya existe
    const { data: usuarioExistente } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', EMAIL_ADMIN)
        .maybeSingle();

    if (usuarioExistente) {
        // Actualizar hash
        const { error } = await supabase
            .from('usuarios')
            .update({
                password_hash: passwordHash,
                activo: true,
                forzar_cambio_password: true,
                intentos_fallidos: 0,
                bloqueado_hasta: null
            })
            .eq('email', EMAIL_ADMIN);

        if (error) {
            console.error('Error al actualizar:', error.message);
            process.exit(1);
        }
        console.log(`\nUsuario actualizado correctamente: ${EMAIL_ADMIN}`);
    } else {
        // Crear usuario nuevo
        const { error } = await supabase
            .from('usuarios')
            .insert({
                nombre: NOMBRE_ADMIN,
                email: EMAIL_ADMIN,
                password_hash: passwordHash,
                rol: 'ADMIN',
                activo: true,
                forzar_cambio_password: true
            });

        if (error) {
            console.error('Error al crear usuario:', error.message);
            process.exit(1);
        }
        console.log(`\nUsuario creado correctamente: ${EMAIL_ADMIN}`);
    }

    console.log('\n--- Credenciales de acceso ---');
    console.log(`Email:      ${EMAIL_ADMIN}`);
    console.log(`Contraseña: ${PASSWORD_TEMP}`);
    console.log('Al ingresar se pedirá cambiar la contraseña temporal.\n');
};

main().catch(err => {
    console.error('Error inesperado:', err.message);
    process.exit(1);
});
