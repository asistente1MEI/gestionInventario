import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { morganMiddleware } from './config/logger.js';
import manejadorErrores from './middlewares/manejadorErrores.js';
import logger from './config/logger.js';

// Rutas
import rutasAuth from './routes/authRoutes.js';
import rutasProductos from './routes/productosRoutes.js';
import rutasProveedores from './routes/proveedoresRoutes.js';
import rutasInventario from './routes/inventarioRoutes.js';
import rutasIngresos from './routes/ingresosRoutes.js';
import rutasEgresos from './routes/egresosRoutes.js';
import rutasAjustes from './routes/ajustesRoutes.js';
import rutasUsuarios from './routes/usuariosRoutes.js';
import rutasDashboard from './routes/dashboardRoutes.js';
import rutasReportes from './routes/reportesRoutes.js';

const app = express();
const PUERTO = process.env.PORT || 4000;

// ── Middlewares globales ──────────────────────────────────────
const origenesPermitidos = [
    'http://localhost:5173',
    process.env.FRONTEND_URL?.replace(/\/$/, ''),
    'https://maderaseingenieria-invenatario.vercel.app'
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || origenesPermitidos.includes(origin.replace(/\/$/, ''))) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS: ' + origin));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morganMiddleware);

// ── Rutas de la API ───────────────────────────────────────────
app.use('/api/auth', rutasAuth);
app.use('/api/productos', rutasProductos);
app.use('/api/proveedores', rutasProveedores);
app.use('/api/inventario', rutasInventario);
app.use('/api/ingresos', rutasIngresos);
app.use('/api/egresos', rutasEgresos);
app.use('/api/ajustes', rutasAjustes);
app.use('/api/usuarios', rutasUsuarios);
app.use('/api/dashboard', rutasDashboard);
app.use('/api/reportes', rutasReportes);

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'MEI API funcionando', timestamp: new Date().toISOString() });
});

// ── Ruta 404 ──────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Ruta no encontrada', data: null });
});

// ── Manejador global de errores ───────────────────────────────
app.use(manejadorErrores);

app.listen(PUERTO, () => {
    logger.info(`MEI Backend escuchando en http://localhost:${PUERTO}`);
});

export default app;
