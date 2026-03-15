/**
 * Plantilla base HTML para todos los correos de MEI.
 * Paleta del sistema: fondo #F8F8F7, sidebar/header #1C1C1C, acento #4A5568
 */
export const plantillaBase = (titulo, cuerpoHtml) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${titulo} — MEI Inventarios</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F8F8F7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; }
    .envoltorio { max-width: 560px; margin: 40px auto; background: #FFFFFF; border: 1px solid #E2E2E2; border-radius: 4px; overflow: hidden; }
    .encabezado { background-color: #1C1C1C; padding: 28px 36px; }
    .encabezado-mei { font-size: 18px; font-weight: 700; color: #FFFFFF; letter-spacing: 0.08em; display: inline-block; }
    .encabezado-subtitulo { font-size: 11px; color: rgba(255,255,255,0.4); letter-spacing: 0.06em; text-transform: uppercase; margin-top: 2px; }
    .cuerpo { padding: 36px; }
    .titulo-email { font-size: 18px; font-weight: 600; color: #1C1C1C; margin: 0 0 12px; letter-spacing: -0.01em; }
    .parrafo { font-size: 14px; color: #4B4B4B; line-height: 1.65; margin: 0 0 16px; }
    .parrafo-ultimo { margin-bottom: 0; }
    .separador { border: none; border-top: 1px solid #E2E2E2; margin: 28px 0; }
    .btn-principal { display: inline-block; padding: 12px 28px; background-color: #4A5568; color: #FFFFFF; text-decoration: none; border-radius: 3px; font-size: 14px; font-weight: 600; letter-spacing: 0.01em; margin: 20px 0; }
    .caja-info { background: #F8F8F7; border-left: 3px solid #4A5568; border-radius: 0 3px 3px 0; padding: 14px 18px; margin: 20px 0; }
    .caja-info p { font-size: 13px; color: #4B4B4B; margin: 0; line-height: 1.6; }
    .caja-info .etiqueta { font-size: 11px; font-weight: 700; color: #6B6B6B; text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 4px; }
    .caja-info .valor { font-size: 15px; font-weight: 600; color: #1C1C1C; font-family: 'Courier New', monospace; word-break: break-all; }
    .aviso { background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 3px; padding: 12px 16px; margin: 20px 0; }
    .aviso p { font-size: 13px; color: #78350F; margin: 0; line-height: 1.55; }
    .pie { background: #F8F8F7; border-top: 1px solid #E2E2E2; padding: 20px 36px; }
    .pie p { font-size: 12px; color: #9CA3AF; margin: 0; line-height: 1.6; }
    .pie strong { color: #6B6B6B; }
  </style>
</head>
<body>
  <div class="envoltorio">
    <div class="encabezado">
      <div class="encabezado-mei">MEI</div>
      <div class="encabezado-subtitulo">Modulo de Inventarios</div>
    </div>
    <div class="cuerpo">
      ${cuerpoHtml}
    </div>
    <div class="pie">
      <p>Este mensaje fue generado automaticamente por el sistema <strong>MEI — Modulo de Inventarios</strong>.<br />Si no solicitaste esta accion, ignora este correo o contacta al administrador del sistema.</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Plantilla: Recuperacion de contraseña
 * @param {string} nombreUsuario
 * @param {string} enlaceReset
 * @param {number} minutosExpiracion
 */
export const plantillaResetPassword = (nombreUsuario, enlaceReset, minutosExpiracion = 30) =>
    plantillaBase('Recuperacion de contrasena', `
        <h1 class="titulo-email">Recuperacion de contrasena</h1>
        <p class="parrafo">Hola ${nombreUsuario},</p>
        <p class="parrafo">Recibimos una solicitud para restablecer la contrasena de tu cuenta en MEI. Haz clic en el boton a continuacion para establecer una nueva contrasena:</p>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${enlaceReset}" class="btn-principal">Restablecer contrasena</a>
        </div>

        <div class="aviso">
          <p>Este enlace expira en <strong>${minutosExpiracion} minutos</strong> y solo puede utilizarse una vez.</p>
        </div>

        <hr class="separador" />

        <p class="parrafo">Si el boton no funciona, copia y pega el siguiente enlace en tu navegador:</p>
        <div class="caja-info">
          <span class="etiqueta">Enlace de restablecimiento</span>
          <span class="valor">${enlaceReset}</span>
        </div>

        <p class="parrafo parrafo-ultimo">Si no solicitaste este cambio, tu contrasena actual permanece sin modificaciones.</p>
    `);

/**
 * Plantilla: Contraseña restablecida exitosamente
 * @param {string} nombreUsuario
 */
export const plantillaPasswordRestablecida = (nombreUsuario) =>
    plantillaBase('Contrasena actualizada', `
        <h1 class="titulo-email">Contrasena actualizada</h1>
        <p class="parrafo">Hola ${nombreUsuario},</p>
        <p class="parrafo">Tu contrasena ha sido restablecida correctamente. Ya puedes ingresar al sistema con tus nuevas credenciales.</p>

        <div class="caja-info">
          <p>Si no realizaste este cambio, contacta al administrador del sistema de inmediato.</p>
        </div>

        <p class="parrafo parrafo-ultimo">Por seguridad, todas las sesiones activas de tu cuenta han sido cerradas automaticamente.</p>
    `);

/**
 * Plantilla: Bienvenida / usuario creado por el admin
 * @param {string} nombreUsuario
 * @param {string} emailUsuario
 * @param {string} passwordTemporal
 * @param {string} enlaceLogin
 */
export const plantillaBienvenida = (nombreUsuario, emailUsuario, passwordTemporal, enlaceLogin) =>
    plantillaBase('Bienvenido a MEI Inventarios', `
        <h1 class="titulo-email">Tu cuenta ha sido creada</h1>
        <p class="parrafo">Hola ${nombreUsuario},</p>
        <p class="parrafo">El administrador del sistema ha creado una cuenta para ti en <strong>MEI — Modulo de Inventarios</strong>. A continuacion encontraras tus credenciales de acceso inicial:</p>

        <div class="caja-info">
          <span class="etiqueta">Correo electronico</span>
          <span class="valor">${emailUsuario}</span>
        </div>

        <div class="caja-info">
          <span class="etiqueta">Contrasena temporal</span>
          <span class="valor">${passwordTemporal}</span>
        </div>

        <div class="aviso">
          <p>Al ingresar por primera vez, el sistema te solicitara establecer una contrasena personal. La contrasena temporal no podra ser reutilizada.</p>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${enlaceLogin}" class="btn-principal">Ingresar al sistema</a>
        </div>

        <p class="parrafo parrafo-ultimo">Por seguridad, no compartas estas credenciales con nadie.</p>
    `);

/**
 * Plantilla: Cuenta bloqueada por intentos fallidos
 * @param {string} nombreUsuario
 * @param {string} minutosBloqueo
 * @param {string} ip
 */
export const plantillaCuentaBloqueada = (nombreUsuario, minutosBloqueo = 30, ip = 'desconocida') =>
    plantillaBase('Cuenta bloqueada temporalmente', `
        <h1 class="titulo-email">Cuenta bloqueada</h1>
        <p class="parrafo">Hola ${nombreUsuario},</p>
        <p class="parrafo">Tu cuenta ha sido bloqueada temporalmente debido a multiples intentos de acceso fallidos.</p>

        <div class="caja-info">
          <span class="etiqueta">Duracion del bloqueo</span>
          <span class="valor">${minutosBloqueo} minutos</span>
        </div>

        <div class="caja-info">
          <span class="etiqueta">IP detectada</span>
          <span class="valor">${ip}</span>
        </div>

        <div class="aviso">
          <p>Si no reconoces esta actividad, contacta al administrador del sistema de inmediato. El bloqueo se levantara automaticamente al finalizar el periodo indicado, o el administrador puede desbloquearte de forma manual.</p>
        </div>

        <p class="parrafo parrafo-ultimo">Si fuiste tu quien intento ingresar, espera y vuelve a intentarlo.</p>
    `);
