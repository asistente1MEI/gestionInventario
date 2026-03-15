import { obtenerKPIsDashboard } from '../services/dashboardService.js';
import { respuestaExitosa, respuestaError } from '../utils/respuesta.js';

export const kpis = async (req, res) => {
    try {
        const datos = await obtenerKPIsDashboard();
        return respuestaExitosa(res, datos, 'KPIs obtenidos');
    } catch (err) {
        return respuestaError(res, 'Error al obtener dashboard', 500);
    }
};
