import React, { useEffect, useState } from 'react';
import {
    Package, TrendingUp, TrendingDown, AlertTriangle, DollarSign
} from 'lucide-react';
import api from '../../services/api.js';
import './DashboardPage.css';

const formatearMoneda = (valor) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor || 0);

const formatearNumero = (n) => new Intl.NumberFormat('es-CO').format(n || 0);

const CardKPI = ({ etiqueta, valor, detalle, icono: Icono, tipo = 'normal' }) => (
    <div className={`card card-kpi dashboard-card-kpi ${tipo === 'alerta' ? 'card-kpi-alerta' : ''}`}>
        <div className="dashboard-kpi-header">
            <span className="kpi-etiqueta">{etiqueta}</span>
            <div className={`dashboard-kpi-icono ${tipo === 'alerta' ? 'dashboard-kpi-icono-alerta' : ''}`}>
                <Icono size={16} />
            </div>
        </div>
        <div className="kpi-valor">{valor}</div>
        {detalle && <div className="kpi-detalle">{detalle}</div>}
    </div>
);

const DashboardPage = () => {
    const [kpis, setKpis] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    const cargarKPIs = async () => {
        try {
            const respuesta = await api.get('/dashboard/kpis');
            setKpis(respuesta.data.data);
        } catch {
            setError('Error al cargar los indicadores');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { cargarKPIs(); }, []);

    const variacionMensual = kpis
        ? kpis.ingresosMesAnterior > 0
            ? (((kpis.ingresosMesActual - kpis.ingresosMesAnterior) / kpis.ingresosMesAnterior) * 100).toFixed(1)
            : null
        : null;

    return (
        <div>
            <div className="encabezado-pagina">
                <div>
                    <h1 className="titulo-pagina">Dashboard</h1>
                    <p className="subtitulo-pagina">Indicadores del inventario en tiempo real</p>
                </div>
            </div>

            {error && <div className="login-error" style={{ marginBottom: 24 }}><p>{error}</p></div>}

            {/* KPI Cards */}
            <div className="grilla-kpis">
                {cargando ? (
                    <>
                        {[1, 2, 3, 4].map(n => (
                            <div key={n} className="card card-kpi">
                                <div className="skeleton skeleton-linea" style={{ width: '60%' }} />
                                <div className="skeleton skeleton-linea" style={{ width: '80%', height: 28, marginTop: 8 }} />
                            </div>
                        ))}
                    </>
                ) : kpis && (
                    <>
                        <CardKPI
                            etiqueta="Productos activos"
                            valor={formatearNumero(kpis.totalProductos)}
                            detalle="En catálogo activo"
                            icono={Package}
                        />
                        <CardKPI
                            etiqueta="Valor del inventario"
                            valor={formatearMoneda(kpis.valorTotalInventario)}
                            detalle="Precio promedio ponderado"
                            icono={DollarSign}
                        />
                        <CardKPI
                            etiqueta="Ingresos este mes"
                            valor={formatearMoneda(kpis.ingresosMesActual)}
                            detalle={variacionMensual !== null
                                ? `${variacionMensual > 0 ? '+' : ''}${variacionMensual}% vs. mes anterior`
                                : 'Sin referencia anterior'}
                            icono={variacionMensual >= 0 ? TrendingUp : TrendingDown}
                        />
                        <CardKPI
                            etiqueta="Stock crítico"
                            valor={formatearNumero(kpis.productosStockBajo)}
                            detalle={`Productos bajo ${kpis.umbralStockMinimo} unidades`}
                            icono={AlertTriangle}
                            tipo={kpis.productosStockBajo > 0 ? 'alerta' : 'normal'}
                        />
                    </>
                )}
            </div>

            {/* Top 5 Productos */}
            {kpis && kpis.top5ProductosMayorStock?.length > 0 && (
                <div className="dashboard-seccion">
                    <h2 className="dashboard-seccion-titulo">Top 5 — Mayor stock actual</h2>
                    <div className="contenedor-tabla">
                        <table className="tabla">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Tipo</th>
                                    <th>Color</th>
                                    <th>Textura</th>
                                    <th>Formato</th>
                                    <th>Espesor</th>
                                    <th>Medida</th>
                                    <th style={{ textAlign: 'right' }}>Cantidad</th>
                                </tr>
                            </thead>
                            <tbody>
                                {kpis.top5ProductosMayorStock.map((p, i) => (
                                    <tr key={p.producto_id}>
                                        <td className="cifra" style={{ color: '#9CA3AF' }}>{i + 1}</td>
                                        <td><span className="badge badge-activo">{p.tipo}</span></td>
                                        <td>{p.color}</td>
                                        <td>{p.textura}</td>
                                        <td>{p.formato}</td>
                                        <td className="cifra">{p.espesor}</td>
                                        <td className="cifra">{p.medida}</td>
                                        <td className="cifra" style={{ textAlign: 'right', fontWeight: 600 }}>
                                            {formatearNumero(p.cantidad_disponible)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardPage;
