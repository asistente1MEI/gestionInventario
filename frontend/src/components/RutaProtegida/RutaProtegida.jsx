import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * Protege una ruta verificando autenticación y rol.
 * Si el usuario tiene forzar_cambio_password activo, redirige al flujo obligatorio.
 * @param {string[]} rolesPermitidos - Lista de roles que pueden acceder. Si es vacío/nulo, solo verifica auth.
 */
const RutaProtegida = ({ children, rolesPermitidos = [] }) => {
    const { usuario, cargando } = useAuth();
    const ubicacion = useLocation();

    if (cargando) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <span style={{ color: '#6B6B6B', fontSize: '0.875rem' }}>Verificando sesión...</span>
            </div>
        );
    }

    if (!usuario) {
        return <Navigate to="/login" state={{ from: ubicacion }} replace />;
    }

    if (usuario.forzarCambioPassword && ubicacion.pathname !== '/cambiar-password') {
        return <Navigate to="/cambiar-password" replace />;
    }

    if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(usuario.rol)) {
        return <Navigate to="/sin-permiso" replace />;
    }

    return children;
};

export default RutaProtegida;
