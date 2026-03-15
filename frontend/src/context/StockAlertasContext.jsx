import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api.js';
import { useAuth } from './AuthContext.jsx';

const ContextoStockAlertas = createContext(null);

const INTERVALO_REFRESCO_MS = 5 * 60 * 1000; // 5 minutos

export const ProveedorStockAlertas = ({ children }) => {
    const { usuario } = useAuth();
    const [alertas, setAlertas] = useState([]);
    const [stockMinimo, setStockMinimo] = useState(5);
    const [cargando, setCargando] = useState(false);

    const refrescar = useCallback(async () => {
        if (!usuario) return;
        setCargando(true);
        try {
            const r = await api.get('/inventario/alertas');
            setAlertas(r.data.data?.alertas || []);
            setStockMinimo(r.data.data?.umbral ?? 5);
        } catch {
            // silenciar — no interrumpir la sesión del usuario
        } finally {
            setCargando(false);
        }
    }, [usuario]);

    // Carga inicial y polling cada 5 min
    useEffect(() => {
        refrescar();
        const intervalo = setInterval(refrescar, INTERVALO_REFRESCO_MS);
        return () => clearInterval(intervalo);
    }, [refrescar]);

    return (
        <ContextoStockAlertas.Provider value={{ alertas, stockMinimo, cargando, refrescar }}>
            {children}
        </ContextoStockAlertas.Provider>
    );
};

export const useStockAlertas = () => {
    const ctx = useContext(ContextoStockAlertas);
    if (!ctx) throw new Error('useStockAlertas debe usarse dentro de ProveedorStockAlertas');
    return ctx;
};
