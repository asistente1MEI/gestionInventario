import { Router } from 'express';
import { kpis } from '../controllers/dashboardController.js';
import { autenticar } from '../middlewares/autenticacion.js';

const rutasDashboard = Router();
rutasDashboard.get('/kpis', autenticar, kpis);
export default rutasDashboard;
