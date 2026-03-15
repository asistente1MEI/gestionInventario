import { Router } from 'express';
import { body } from 'express-validator';
import {
    listarUsuarios, nuevoUsuario, editarUsuario, desbloquearCuentaUsuario,
    auditoria, sesionesActivas, revocarSesion, obtenerConfiguracion, actualizarConfiguracion
} from '../controllers/usuariosController.js';
import { autenticar, autorizar } from '../middlewares/autenticacion.js';

const rutasUsuarios = Router();

// Solo ADMIN puede gestionar usuarios
rutasUsuarios.get('/', autenticar, autorizar('ADMIN'), listarUsuarios);
rutasUsuarios.post('/', autenticar, autorizar('ADMIN'), [
    body('nombre').notEmpty().withMessage('Nombre requerido'),
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Mínimo 8 caracteres')
        .matches(/[A-Z]/).withMessage('Debe tener al menos una mayúscula')
        .matches(/[0-9]/).withMessage('Debe tener al menos un número'),
    body('rol').isIn(['ADMIN', 'OPERADOR', 'SOLO_LECTURA']).withMessage('Rol inválido')
], nuevoUsuario);
rutasUsuarios.put('/:id', autenticar, autorizar('ADMIN'), editarUsuario);
rutasUsuarios.post('/:id/desbloquear', autenticar, autorizar('ADMIN'), desbloquearCuentaUsuario);

// Auditoría y sesiones (solo ADMIN)
rutasUsuarios.get('/auditoria/logins', autenticar, autorizar('ADMIN'), auditoria);
rutasUsuarios.get('/sesiones/activas', autenticar, autorizar('ADMIN'), sesionesActivas);
rutasUsuarios.delete('/sesiones/:tokenId', autenticar, autorizar('ADMIN'), revocarSesion);

// Configuración del sistema
rutasUsuarios.get('/configuracion/:clave', autenticar, autorizar('ADMIN'), obtenerConfiguracion);
rutasUsuarios.put('/configuracion/:clave', autenticar, autorizar('ADMIN'), actualizarConfiguracion);

export default rutasUsuarios;
