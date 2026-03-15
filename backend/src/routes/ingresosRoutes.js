import { Router } from 'express';
import { body } from 'express-validator';
import { listarIngresos, nuevoIngreso } from '../controllers/ingresosController.js';
import { autenticar, autorizar } from '../middlewares/autenticacion.js';

const rutasIngresos = Router();
rutasIngresos.get('/', autenticar, listarIngresos);
rutasIngresos.post('/', autenticar, autorizar('ADMIN', 'OPERADOR'), [
    body('producto_id').isUUID().withMessage('ID de producto inválido'),
    body('cantidad').isFloat({ min: 0.01 }).withMessage('Cantidad debe ser mayor a 0'),
    body('precio_compra_unitario').isFloat({ min: 0 }).withMessage('Precio inválido')
], nuevoIngreso);
export default rutasIngresos;
