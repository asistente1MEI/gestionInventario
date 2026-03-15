import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Package, ArrowDownCircle, ArrowUpCircle,
    Scale, Users, FileText, Settings, LogOut,
    ChevronLeft, ChevronRight, Truck, ClipboardList, Menu, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../Toast/Toast.jsx';
import { alerta } from '../../utils/alerta.js';
import CampanaAlertas from '../CampanaAlertas/CampanaAlertas.jsx';
import './Sidebar.css';

const elementosNav = [
    { etiqueta: 'Dashboard', icono: LayoutDashboard, ruta: '/dashboard', roles: ['ADMIN', 'OPERADOR', 'SOLO_LECTURA'] },
    { etiqueta: 'Inventario', icono: Package, ruta: '/inventario', roles: ['ADMIN', 'OPERADOR', 'SOLO_LECTURA'] },
    { etiqueta: 'Ingresos', icono: ArrowDownCircle, ruta: '/ingresos', roles: ['ADMIN', 'OPERADOR'] },
    { etiqueta: 'Salidas', icono: ArrowUpCircle, ruta: '/egresos', roles: ['ADMIN', 'OPERADOR'] },
    { etiqueta: 'Productos', icono: ClipboardList, ruta: '/productos', roles: ['ADMIN', 'OPERADOR'] },
    { etiqueta: 'Proveedores', icono: Truck, ruta: '/proveedores', roles: ['ADMIN', 'OPERADOR'] },
    { etiqueta: 'Ajustes', icono: Scale, ruta: '/ajustes', roles: ['ADMIN', 'OPERADOR'] },
    { etiqueta: 'Reportes', icono: FileText, ruta: '/reportes', roles: ['ADMIN', 'OPERADOR', 'SOLO_LECTURA'] },
    { etiqueta: 'Configuración', icono: Settings, ruta: '/configuracion', roles: ['ADMIN'] },
];

const Sidebar = ({ colapsado, onToggle }) => {
    const { usuario, cerrarSesion } = useAuth();
    const { exito } = useToast();
    const navegar = useNavigate();
    const location = useLocation();

    // Estado del drawer móvil (independiente del colapsado de desktop)
    const [drawerAbierto, setDrawerAbierto] = useState(false);

    // Cerrar drawer al navegar a otra ruta
    useEffect(() => {
        setDrawerAbierto(false);
    }, [location.pathname]);

    const manejarCerrarSesion = async () => {
        setDrawerAbierto(false);
        const { isConfirmed } = await alerta.fire({
            icon: 'question',
            title: '¿Cerrar sesión?',
            text: `¿Seguro que deseas salir, ${usuario?.nombre?.split(' ')[0] || ''}?`,
            showCancelButton: true,
            confirmButtonText: 'Sí, salir',
            cancelButtonText: 'Cancelar',
        });
        if (!isConfirmed) return;
        await cerrarSesion();
        exito('Sesión cerrada correctamente');
        navegar('/login');
    };

    const elementosFiltrados = elementosNav.filter(
        e => usuario && e.roles.includes(usuario.rol)
    );

    return (
        <>
            {/* ── Header móvil (solo visible en ≤640px) ─────────── */}
            <div className="header-movil">
                <button
                    className="header-movil-hamburguesa"
                    onClick={() => setDrawerAbierto(true)}
                    aria-label="Abrir menú"
                >
                    <Menu size={22} />
                </button>
                <div className="header-movil-logo">
                    <span className="header-movil-logo-mei">MEI</span>
                    <span className="header-movil-logo-subtitulo">Inventarios</span>
                </div>
                {usuario && (
                    <span className="header-movil-usuario">
                        {usuario.nombre?.split(' ')[0]}
                    </span>
                )}
                {/* Campana en móvil */}
                <CampanaAlertas />
            </div>

            {/* ── Overlay oscuro al abrir el drawer ──────────────── */}
            {drawerAbierto && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setDrawerAbierto(false)}
                    aria-hidden="true"
                />
            )}

            {/* ── Sidebar (desktop: colapsable | móvil: drawer) ──── */}
            <aside className={`sidebar ${colapsado ? 'sidebar-colapsado' : ''} ${drawerAbierto ? 'sidebar-drawer-abierto' : ''}`}>

                {/* Botón cerrar dentro del drawer (solo móvil) */}
                <button
                    className="sidebar-drawer-cerrar"
                    onClick={() => setDrawerAbierto(false)}
                    aria-label="Cerrar menú"
                >
                    <X size={18} />
                </button>

                {/* Logo / header del sidebar */}
                <div className="sidebar-logo">
                    {!colapsado && (
                        <div className="sidebar-logo-texto">
                            <span className="sidebar-logo-mei">MEI</span>
                            <span className="sidebar-logo-subtitulo">Inventarios</span>
                        </div>
                    )}
                    {/* Botón colapsar solo en desktop */}
                    <button
                        className="sidebar-toggle sidebar-toggle-desktop"
                        onClick={onToggle}
                        title={colapsado ? 'Expandir' : 'Colapsar'}
                    >
                        {colapsado ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                </div>

                {/* Navegación */}
                <nav className="sidebar-nav">
                    {elementosFiltrados.map(({ etiqueta, icono: Icono, ruta }) => (
                        <NavLink
                            key={ruta}
                            to={ruta}
                            className={({ isActive }) => `sidebar-item ${isActive ? 'sidebar-item-activo' : ''}`}
                            title={colapsado ? etiqueta : ''}
                        >
                            <Icono size={18} className="sidebar-icono" />
                            <span className="sidebar-etiqueta">{etiqueta}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Footer: usuario + logout */}
                <div className="sidebar-footer">
                    {!colapsado && usuario && (
                        <div className="sidebar-usuario">
                            <div className="sidebar-usuario-nombre">{usuario.nombre}</div>
                            <div className="sidebar-usuario-rol">{usuario.rol}</div>
                        </div>
                    )}
                    <button
                        className="sidebar-item sidebar-item-logout"
                        onClick={manejarCerrarSesion}
                        title="Cerrar sesión"
                    >
                        <LogOut size={18} className="sidebar-icono" />
                        {!colapsado && <span className="sidebar-etiqueta">Salir</span>}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
