/**
 * Toast.jsx — implementación con SweetAlert2
 *
 * Mantiene la misma interfaz pública (ProveedorToast + useToast)
 * para no modificar ningún componente existente.
 * El renderizado visual ahora lo hace SweetAlert2 toast mode.
 */
import React, { createContext, useContext, useCallback } from 'react';
import Swal from 'sweetalert2';

const ContextoToast = createContext(null);

// ── Mixin base para los toasts ──────────────────────────────────────────────
const swalToast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3500,
    timerProgressBar: true,
    customClass: {
        popup:  'mei-toast-popup',
        title:  'mei-toast-titulo',
        timerProgressBar: 'mei-toast-barra',
    },
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
});

// ── Funciones de toast por tipo ─────────────────────────────────────────────
const mostrarToast = (icon, title) => swalToast.fire({ icon, title });

export const ProveedorToast = ({ children }) => {
    const exito      = useCallback((msg) => mostrarToast('success', msg), []);
    const error      = useCallback((msg) => mostrarToast('error',   msg), []);
    const advertencia = useCallback((msg) => mostrarToast('warning', msg), []);
    const info       = useCallback((msg) => mostrarToast('info',    msg), []);

    return (
        <ContextoToast.Provider value={{ exito, error, advertencia, info }}>
            {children}
            {/* SweetAlert2 se monta fuera del árbol — no se necesita contenedor */}
        </ContextoToast.Provider>
    );
};

export const useToast = () => {
    const ctx = useContext(ContextoToast);
    if (!ctx) throw new Error('useToast debe usarse dentro de ProveedorToast');
    return ctx;
};
