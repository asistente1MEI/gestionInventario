import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api.js';

const ContextoAuth = createContext(null);

export const ProveedorAuth = ({ children }) => {
    const [usuario, setUsuario] = useState(null);
    const [cargando, setCargando] = useState(true);

    const verificarSesion = useCallback(async () => {
        try {
            const tokenGuardado = localStorage.getItem('mei_access_token');
            if (!tokenGuardado) {
                setCargando(false);
                return;
            }
            // El interceptor de api.js maneja automáticamente el refresh si el token expiró.
            // Si el refresh también falla, el interceptor borra el token y redirige a /login.
            // Por eso aquí NO borramos el token en el catch — dejamos que el interceptor lo maneje.
            const respuesta = await api.get('/auth/me');
            setUsuario(respuesta.data.data);
        } catch (err) {
            // Solo limpiar la sesión local si el error es definitivo
            // (el interceptor ya intentó el refresh y falló — en ese caso
            // window.location.href = '/login' ya se ejecutó en api.js).
            // Solo llegamos aquí si la redirección no ocurrió (ej: red offline).
            const tokenActual = localStorage.getItem('mei_access_token');
            if (!tokenActual) {
                // El interceptor ya borró el token → sesión expirada definitivamente
                setUsuario(null);
            }
            // Si el token sigue ahí, fue un error de red transitorio → no desloguear
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        verificarSesion();
    }, [verificarSesion]);

    const iniciarSesion = (accessToken, datosUsuario) => {
        localStorage.setItem('mei_access_token', accessToken);
        setUsuario(datosUsuario);
    };

    const cerrarSesion = async () => {
        try {
            await api.post('/auth/logout');
        } catch { /* ignorar */ } finally {
            localStorage.removeItem('mei_access_token');
            setUsuario(null);
        }
    };

    const actualizarUsuario = (datosNuevos) => {
        setUsuario(prev => ({ ...prev, ...datosNuevos }));
    };

    return (
        <ContextoAuth.Provider value={{ usuario, cargando, iniciarSesion, cerrarSesion, actualizarUsuario }}>
            {children}
        </ContextoAuth.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(ContextoAuth);
    if (!ctx) throw new Error('useAuth debe usarse dentro de ProveedorAuth');
    return ctx;
};
