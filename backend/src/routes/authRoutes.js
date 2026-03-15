import { Router } from 'express';
import { body } from 'express-validator';
import {
    login,
    refrescarToken,
    logout,
    olvideMiPassword,
    resetPassword,
    cambiarPassword,
    obtenerPerfil
} from '../controllers/authController.js';
import { autenticar } from '../middlewares/autenticacion.js';

const rutasAuth = Router();

// POST /api/auth/login
rutasAuth.post('/login', [
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password').notEmpty().withMessage('La contraseña es requerida')
], login);

// POST /api/auth/refresh
rutasAuth.post('/refresh', refrescarToken);

// POST /api/auth/logout
rutasAuth.post('/logout', autenticar, logout);

// POST /api/auth/forgot-password
rutasAuth.post('/forgot-password', [
    body('email').isEmail().withMessage('Email inválido').normalizeEmail()
], olvideMiPassword);

// POST /api/auth/reset-password
rutasAuth.post('/reset-password', [
    body('token').notEmpty().withMessage('Token requerido'),
    body('nueva_password')
        .isLength({ min: 8 }).withMessage('Mínimo 8 caracteres')
        .matches(/[A-Z]/).withMessage('Debe contener al menos una mayúscula')
        .matches(/[0-9]/).withMessage('Debe contener al menos un número')
], resetPassword);

// POST /api/auth/change-password (cambio obligatorio y voluntario)
rutasAuth.post('/change-password', autenticar, [
    body('password_actual').notEmpty().withMessage('Contraseña actual requerida'),
    body('nueva_password')
        .isLength({ min: 8 }).withMessage('Mínimo 8 caracteres')
        .matches(/[A-Z]/).withMessage('Debe contener al menos una mayúscula')
        .matches(/[0-9]/).withMessage('Debe contener al menos un número')
], cambiarPassword);

// GET /api/auth/me
rutasAuth.get('/me', autenticar, obtenerPerfil);

export default rutasAuth;
