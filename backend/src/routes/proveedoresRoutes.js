import { Router } from 'express';
import {
    listarProveedores, obtenerProveedor, nuevoProveedor,
    editarProveedor, darDeBajaProveedor, ingresosDeProveedor
} from '../controllers/proveedoresController.js';
import { autenticar, autorizar } from '../middlewares/autenticacion.js';

const rutasProveedores = Router();
rutasProveedores.get('/', autenticar, listarProveedores);
rutasProveedores.get('/:id', autenticar, obtenerProveedor);
rutasProveedores.get('/:id/ingresos', autenticar, ingresosDeProveedor);
rutasProveedores.post('/', autenticar, autorizar('ADMIN', 'OPERADOR'), nuevoProveedor);
rutasProveedores.put('/:id', autenticar, autorizar('ADMIN', 'OPERADOR'), editarProveedor);
rutasProveedores.delete('/:id', autenticar, autorizar('ADMIN'), darDeBajaProveedor);
export default rutasProveedores;
