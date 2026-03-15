import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellRing, AlertTriangle, X, ArrowRight } from 'lucide-react';
import { useStockAlertas } from '../../context/StockAlertasContext.jsx';
import './CampanaAlertas.css';

const CampanaAlertas = () => {
    const { alertas, stockMinimo, cargando } = useStockAlertas();
    const [abierto, setAbierto] = useState(false);
    const wrapperRef = useRef(null);

    const tieneAlertas = alertas.length > 0;

    // Cerrar al hacer clic fuera
    useEffect(() => {
        const manejarClickFuera = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setAbierto(false);
            }
        };
        if (abierto) document.addEventListener('mousedown', manejarClickFuera);
        return () => document.removeEventListener('mousedown', manejarClickFuera);
    }, [abierto]);

    const etiquetaProducto = (a) =>
        `${a.tipo} — ${a.color} / ${a.textura} / ${a.formato}`;

    const esCero = (a) => parseFloat(a.cantidad_disponible) === 0;

    return (
        <div className="campana-wrapper" ref={wrapperRef}>
            <button
                className={`campana-btn ${tieneAlertas ? 'tiene-alertas' : ''}`}
                onClick={() => setAbierto(v => !v)}
                title={tieneAlertas ? `${alertas.length} productos con stock crítico` : 'Sin alertas de stock'}
                id="btn-campana-alertas"
            >
                {tieneAlertas
                    ? <BellRing size={20} className="campana-icono-alerta" />
                    : <Bell size={20} />
                }
                {tieneAlertas && (
                    <span className="campana-badge">
                        {alertas.length > 99 ? '99+' : alertas.length}
                    </span>
                )}
            </button>

            {abierto && (
                <div className="campana-panel" role="dialog" aria-label="Alertas de stock">
                    {/* Header */}
                    <div className="campana-panel-header">
                        <div className="campana-panel-titulo">
                            <AlertTriangle size={14} />
                            Stock Crítico {tieneAlertas && `(${alertas.length})`}
                        </div>
                        <button
                            className="campana-panel-cerrar"
                            onClick={() => setAbierto(false)}
                            aria-label="Cerrar"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    {/* Lista */}
                    <div className="campana-lista">
                        {cargando ? (
                            <div className="campana-vacia">Verificando stock...</div>
                        ) : !tieneAlertas ? (
                            <div className="campana-vacia">
                                ✅ Todo el stock está por encima del mínimo ({stockMinimo} unidades)
                            </div>
                        ) : (
                            alertas.map((a) => (
                                <div key={a.producto_id} className="campana-item">
                                    <AlertTriangle
                                        size={16}
                                        className={`campana-item-icono ${esCero(a) ? '' : 'advertencia'}`}
                                    />
                                    <div className="campana-item-info">
                                        <div className="campana-item-nombre" title={etiquetaProducto(a)}>
                                            {etiquetaProducto(a)}
                                        </div>
                                        <div className="campana-item-cantidad">
                                            {esCero(a)
                                                ? <><strong>Sin stock</strong> · mínimo: {stockMinimo}</>
                                                : <>Stock: <strong>{a.cantidad_disponible}</strong> · mínimo: {stockMinimo}</>
                                            }
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {tieneAlertas && (
                        <div className="campana-panel-footer">
                            <Link
                                to="/inventario"
                                className="campana-link-inventario"
                                onClick={() => setAbierto(false)}
                            >
                                Ver inventario completo <ArrowRight size={14} />
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CampanaAlertas;
