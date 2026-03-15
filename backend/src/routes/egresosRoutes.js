import { Router } from 'express';
import { body } from 'express-validator';
import { listarEgresos, nuevoEgreso } from '../controllers/egresosController.js';
import { autenticar, autorizar } from '../middlewares/autenticacion.js';

const rutasEgresos = Router();
rutasEgresos.get('/', autenticar, listarEgresos);
rutasEgresos.post('/', autenticar, autorizar('ADMIN', 'OPERADOR'), [
    body('producto_id').isUUID().withMessage('ID de producto inválido'),
    body('cantidad').isFloat({ min: 0.01 }).withMessage('Cantidad debe ser mayor a 0'),
    body('motivo').isIn(['VENTA', 'AJUSTE', 'CORTE', 'DEVOLUCION']).withMessage('Motivo inválido')
], nuevoEgreso);
export default rutasEgresos;
