import { Router } from 'express';
import { movimientos, kardexProducto, stockActual, rotacion } from '../controllers/reportesController.js';
import { autenticar } from '../middlewares/autenticacion.js';

const rutasReportes = Router();
rutasReportes.get('/movimientos', autenticar, movimientos);
rutasReportes.get('/kardex/:productoId', autenticar, kardexProducto);
rutasReportes.get('/stock-actual', autenticar, stockActual);
rutasReportes.get('/rotacion', autenticar, rotacion);
export default rutasReportes;
