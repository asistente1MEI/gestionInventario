import morgan from 'morgan';

// Logger simple usando morgan para desarrollo y niveles básicos para producción
const esDevelopment = process.env.NODE_ENV !== 'production';

const logger = {
    info: (mensaje, meta = '') => {
        if (esDevelopment) console.info(`[INFO] ${new Date().toISOString()} - ${mensaje}`, meta);
    },
    warn: (mensaje, meta = '') => {
        console.warn(`[WARN] ${new Date().toISOString()} - ${mensaje}`, meta);
    },
    error: (mensaje, meta = '') => {
        console.error(`[ERROR] ${new Date().toISOString()} - ${mensaje}`, meta);
    },
    debug: (mensaje, meta = '') => {
        if (esDevelopment) console.debug(`[DEBUG] ${new Date().toISOString()} - ${mensaje}`, meta);
    }
};

// Middleware de morgan para Express
export const morganMiddleware = morgan(
    esDevelopment ? 'dev' : 'combined'
);

export default logger;
