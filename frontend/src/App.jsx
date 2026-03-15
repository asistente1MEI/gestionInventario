import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProveedorAuth } from './context/AuthContext.jsx';
import { ProveedorToast } from './components/Toast/Toast.jsx';
import RutaProtegida from './components/RutaProtegida/RutaProtegida.jsx';
import Sidebar from './components/Sidebar/Sidebar.jsx';
import { ProveedorStockAlertas } from './context/StockAlertasContext.jsx';
import CampanaAlertas from './components/CampanaAlertas/CampanaAlertas.jsx';

// Páginas
import LoginPage from './pages/LoginPage/LoginPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage/ResetPasswordPage.jsx';
import CambiarPasswordPage from './pages/CambiarPasswordPage/CambiarPasswordPage.jsx';
import DashboardPage from './pages/DashboardPage/DashboardPage.jsx';
import InventarioPage from './pages/InventarioPage/InventarioPage.jsx';
import IngresosPage from './pages/IngresosPage/IngresosPage.jsx';
import EgresosPage from './pages/EgresosPage/EgresosPage.jsx';
import ProductosPage from './pages/ProductosPage/ProductosPage.jsx';
import ProveedoresPage from './pages/ProveedoresPage/ProveedoresPage.jsx';
import AjustesPage from './pages/AjustesPage/AjustesPage.jsx';
import ReportesPage from './pages/ReportesPage/ReportesPage.jsx';
import ConfiguracionPage from './pages/ConfiguracionPage/ConfiguracionPage.jsx';

const LayoutPrincipal = ({ children }) => {
    const [sidebarColapsado, setSidebarColapsado] = useState(false);

    return (
        <div className="layout-principal">
            <Sidebar
                colapsado={sidebarColapsado}
                onToggle={() => setSidebarColapsado(v => !v)}
            />
            {/* Campana fija top-right (solo desktop, móvil la tiene en header-movil) */}
            <div className="campana-top-right">
                <CampanaAlertas />
            </div>
            <main className={`contenido-principal ${sidebarColapsado ? 'sidebar-colapsado' : ''}`}>
                <div className="area-pagina">
                    {children}
                </div>
            </main>
        </div>
    );
};

const App = () => (
    <BrowserRouter>
        <ProveedorAuth>
            <ProveedorToast>
                <ProveedorStockAlertas>
                <Routes>
                    {/* Rutas públicas */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />

                    {/* Cambio de contraseña obligatorio */}
                    <Route path="/cambiar-password" element={
                        <RutaProtegida>
                            <CambiarPasswordPage />
                        </RutaProtegida>
                    } />

                    {/* Rutas protegidas con layout */}
                    <Route path="/dashboard" element={
                        <RutaProtegida>
                            <LayoutPrincipal><DashboardPage /></LayoutPrincipal>
                        </RutaProtegida>
                    } />
                    <Route path="/inventario" element={
                        <RutaProtegida>
                            <LayoutPrincipal><InventarioPage /></LayoutPrincipal>
                        </RutaProtegida>
                    } />
                    <Route path="/ingresos" element={
                        <RutaProtegida rolesPermitidos={['ADMIN', 'OPERADOR']}>
                            <LayoutPrincipal><IngresosPage /></LayoutPrincipal>
                        </RutaProtegida>
                    } />
                    <Route path="/egresos" element={
                        <RutaProtegida rolesPermitidos={['ADMIN', 'OPERADOR']}>
                            <LayoutPrincipal><EgresosPage /></LayoutPrincipal>
                        </RutaProtegida>
                    } />
                    <Route path="/productos" element={
                        <RutaProtegida rolesPermitidos={['ADMIN', 'OPERADOR']}>
                            <LayoutPrincipal><ProductosPage /></LayoutPrincipal>
                        </RutaProtegida>
                    } />
                    <Route path="/proveedores" element={
                        <RutaProtegida rolesPermitidos={['ADMIN', 'OPERADOR']}>
                            <LayoutPrincipal><ProveedoresPage /></LayoutPrincipal>
                        </RutaProtegida>
                    } />
                    <Route path="/ajustes" element={
                        <RutaProtegida rolesPermitidos={['ADMIN', 'OPERADOR']}>
                            <LayoutPrincipal><AjustesPage /></LayoutPrincipal>
                        </RutaProtegida>
                    } />
                    <Route path="/reportes" element={
                        <RutaProtegida>
                            <LayoutPrincipal><ReportesPage /></LayoutPrincipal>
                        </RutaProtegida>
                    } />
                    <Route path="/configuracion" element={
                        <RutaProtegida rolesPermitidos={['ADMIN']}>
                            <LayoutPrincipal><ConfiguracionPage /></LayoutPrincipal>
                        </RutaProtegida>
                    } />

                    {/* Sin permiso */}
                    <Route path="/sin-permiso" element={
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:'16px' }}>
                            <h2 style={{ fontSize:'1.25rem', color:'#2D2D2D' }}>Sin permiso</h2>
                            <p style={{ color:'#6B6B6B', fontSize:'0.875rem' }}>No tienes acceso a esta sección.</p>
                        </div>
                    } />

                    {/* Redireccionamiento raíz */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
                </ProveedorStockAlertas>
            </ProveedorToast>
        </ProveedorAuth>
    </BrowserRouter>
);

export default App;
