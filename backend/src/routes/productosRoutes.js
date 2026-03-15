import { Router } from 'express';
import { body } from 'express-validator';
import {
    listarProductos, obtenerProducto, nuevoProduto,
    editarProducto, darDeBajaProducto, reactivarProducto, filtrosDisponibles, importarProductos
} from '../controllers/productosController.js';
import { autenticar, autorizar } from '../middlewares/autenticacion.js';

const rutasProductos = Router();

const validacionProducto = [
    body('tipo').isIn(['LAMINA', 'FONDOS']).withMessage('Tipo inválido'),
    body('color').notEmpty().withMessage('Color requerido'),
    body('textura').notEmpty().withMessage('Textura requerida'),
    body('formato').notEmpty().withMessage('Formato requerido'),
    body('espesor').notEmpty().withMessage('Espesor requerido'),
    body('medida').notEmpty().withMessage('Medida requerida')
];

rutasProductos.get('/', autenticar, listarProductos);
rutasProductos.get('/filtros', autenticar, filtrosDisponibles);
rutasProductos.get('/:id', autenticar, obtenerProducto);
rutasProductos.post('/', autenticar, autorizar('ADMIN', 'OPERADOR'), validacionProducto, nuevoProduto);
rutasProductos.post('/importar', autenticar, autorizar('ADMIN', 'OPERADOR'), importarProductos);
rutasProductos.put('/:id', autenticar, autorizar('ADMIN', 'OPERADOR'), editarProducto);
rutasProductos.patch('/:id/activar', autenticar, autorizar('ADMIN'), reactivarProducto);
rutasProductos.delete('/:id', autenticar, autorizar('ADMIN'), darDeBajaProducto);

export default rutasProductos;
