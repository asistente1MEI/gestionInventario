import { Router } from 'express';
import { listarInventario, resumenInventario, alertasStock } from '../controllers/inventarioController.js';
import { autenticar } from '../middlewares/autenticacion.js';

const rutasInventario = Router();
rutasInventario.get('/', autenticar, listarInventario);
rutasInventario.get('/resumen', autenticar, resumenInventario);
rutasInventario.get('/alertas', autenticar, alertasStock);
export default rutasInventario;
