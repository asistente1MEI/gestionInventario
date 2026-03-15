import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    withCredentials: true, // Enviar cookies (refresh token httpOnly)
    headers: { 'Content-Type': 'application/json' }
});

// Interceptor: adjunta el access token a cada request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('mei_access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

let estaRefrescando = false;
let colaEnEspera = [];

const procesarCola = (error, token = null) => {
    colaEnEspera.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve(token);
    });
    colaEnEspera = [];
};

// Interceptor: maneja 401 y renueva el access token automáticamente
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const solicitudOriginal = error.config;

        if (error.response?.status === 401 && !solicitudOriginal._reintentado) {
            if (estaRefrescando) {
                return new Promise((resolve, reject) => {
                    colaEnEspera.push({ resolve, reject });
                }).then(token => {
                    solicitudOriginal.headers.Authorization = `Bearer ${token}`;
                    return api(solicitudOriginal);
                }).catch(err => Promise.reject(err));
            }

            solicitudOriginal._reintentado = true;
            estaRefrescando = true;

            try {
                const respuesta = await api.post('/auth/refresh');
                const nuevoToken = respuesta.data.data.accessToken;
                localStorage.setItem('mei_access_token', nuevoToken);
                api.defaults.headers.Authorization = `Bearer ${nuevoToken}`;
                procesarCola(null, nuevoToken);
                solicitudOriginal.headers.Authorization = `Bearer ${nuevoToken}`;
                return api(solicitudOriginal);
            } catch (errRefresh) {
                procesarCola(errRefresh, null);
                localStorage.removeItem('mei_access_token');
                window.location.href = '/login';
                return Promise.reject(errRefresh);
            } finally {
                estaRefrescando = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
