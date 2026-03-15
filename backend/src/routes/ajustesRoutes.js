import { Router } from 'express';
import { body } from 'express-validator';
import { listarAjustes, nuevoAjuste } from '../controllers/ajustesController.js';
import { autenticar, autorizar } from '../middlewares/autenticacion.js';

const rutasAjustes = Router();
rutasAjustes.get('/', autenticar, listarAjustes);
rutasAjustes.post('/', autenticar, autorizar('ADMIN', 'OPERADOR'), [
    body('producto_id').isUUID().withMessage('ID de producto inválido'),
    body('cantidad_nueva').isFloat({ min: 0 }).withMessage('Cantidad nueva debe ser >= 0'),
    body('motivo').notEmpty().withMessage('El motivo del ajuste es obligatorio')
        .isLength({ min: 10 }).withMessage('El motivo debe tener al menos 10 caracteres')
], nuevoAjuste);
export default rutasAjustes;
