import axios from 'axios';

const api = axios.create({
    // Usa la variable de entorno, si no existe o cae por defecto usa '/api'
    baseURL: import.meta.env.VITE_API_URL || '/api',
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

                // Si no estamos ya en la página de login, mostrar alerta profesional
                if (window.location.pathname !== '/login') {
                    import('sweetalert2').then(({ default: Swal }) => {
                        let timerInterval;
                        Swal.fire({
                            title: 'Sesión expirada',
                            html: 'Por seguridad tu sesión ha finalizado.<br/>Redirigiendo en <b></b> segundos.',
                            icon: 'info',
                            timer: 4000,
                            timerProgressBar: true,
                            allowOutsideClick: false,
                            allowEscapeKey: false,
                            showConfirmButton: false,
                            customClass: {
                                popup: 'mei-swal-popup',
                                title: 'mei-swal-titulo',
                                htmlContainer: 'mei-swal-cuerpo'
                            },
                            didOpen: () => {
                                const b = Swal.getHtmlContainer().querySelector('b');
                                timerInterval = setInterval(() => {
                                    b.textContent = Math.ceil(Swal.getTimerLeft() / 1000);
                                }, 100);
                            },
                            willClose: () => {
                                clearInterval(timerInterval);
                            }
                        }).then(() => {
                            window.location.href = '/login';
                        });
                    });
                }
                
                return Promise.reject(errRefresh);
            } finally {
                estaRefrescando = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
