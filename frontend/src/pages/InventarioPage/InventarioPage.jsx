import React, { useEffect, useState, useCallback } from 'react';
import { Search, AlertTriangle } from 'lucide-react';
import api from '../../services/api.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { usePaginacion } from '../../hooks/usePaginacion.js';
import { useStockAlertas } from '../../context/StockAlertasContext.jsx';
import './InventarioPage.css';

const formatearMoneda = (v) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v || 0);
const formatearNum = (n) => new Intl.NumberFormat('es-CO').format(n || 0);

const InventarioPage = () => {
    const [datos, setDatos] = useState([]);
    const [paginacion, setPaginacion] = useState(null);
    const [filtros, setFiltros] = useState({});
    const [busqueda, setBusqueda] = useState('');
    const [opciones, setOpciones] = useState({});
    const [cargando, setCargando] = useState(true);
    // Umbral dinámico desde el context de alertas (sincronizado con la config del backend)
    const { stockMinimo, refrescar: refrescarAlertas } = useStockAlertas();
    const { pagina, limite, irAPagina, paginaSiguiente, paginaAnterior, reiniciarPagina } = usePaginacion(20);

    const cargarOpciones = async () => {
        try {
            const r = await api.get('/productos/filtros');
            setOpciones(r.data.data || {});
        } catch { /* silenciar */ }
    };

    const cargarInventario = useCallback(async (termino = '') => {
        setCargando(true);
        try {
            const params = { ...filtros, page: pagina, limit: limite };
            if (termino) params.busqueda = termino;
            const r = await api.get('/inventario', { params });
            setDatos(r.data.data || []);
            setPaginacion(r.data.pagination);
        } catch { /* silenciar */ } finally {
            setCargando(false);
        }
    }, [filtros, pagina, limite]);

    const buscarDebounced = useDebounce((termino) => {
        reiniciarPagina();
        cargarInventario(termino);
    }, 300);

    useEffect(() => { cargarOpciones(); }, []);
    useEffect(() => { cargarInventario(busqueda); }, [cargarInventario]);

    const manejarBusqueda = (e) => {
        setBusqueda(e.target.value);
        buscarDebounced(e.target.value);
    };

    const manejarFiltro = (campo, valor) => {
        setFiltros(prev => ({ ...prev, [campo]: valor || undefined }));
        reiniciarPagina();
    };

    const limpiarFiltros = () => {
        setFiltros({});
        setBusqueda('');
        reiniciarPagina();
    };

    const esCritico = (cantidad) => parseFloat(cantidad) < stockMinimo;
    const esSinStock = (cantidad) => parseFloat(cantidad) === 0;

    return (
        <div>
            <div className="encabezado-pagina">
                <div>
                    <h1 className="titulo-pagina">Inventario</h1>
                    <p className="subtitulo-pagina">Stock actual de láminas y materiales</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="barra-filtros">
                <div className="busqueda-wrapper filtro-item" style={{ flex: 2, minWidth: 220 }}>
                    <Search size={14} className="icono-busqueda" />
                    <input
                        className="input"
                        style={{ paddingLeft: 34 }}
                        placeholder="Buscar por color, textura, formato..."
                        value={busqueda}
                        onChange={manejarBusqueda}
                        id="inventario-busqueda"
                    />
                </div>

                {[
                    { campo: 'tipo', etiqueta: 'Tipo', items: opciones.tipos || [] },
                    { campo: 'color', etiqueta: 'Color', items: opciones.colores || [] },
                    { campo: 'textura', etiqueta: 'Textura', items: opciones.texturas || [] },
                    { campo: 'formato', etiqueta: 'Formato', items: opciones.formatos || [] },
                    { campo: 'espesor', etiqueta: 'Espesor', items: opciones.espesores || [] },
                    { campo: 'medida', etiqueta: 'Medida', items: opciones.medidas || [] },
                ].map(({ campo, etiqueta, items }) => (
                    <div key={campo} className="filtro-item">
                        <select
                            className="select-campo"
                            value={filtros[campo] || ''}
                            onChange={e => manejarFiltro(campo, e.target.value)}
                            id={`filtro-${campo}`}
                        >
                            <option value="">{etiqueta}</option>
                            {items.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
                ))}

                {Object.values(filtros).some(Boolean) || busqueda ? (
                    <button className="btn btn-secundario btn-sm" onClick={limpiarFiltros} id="btn-limpiar-filtros">
                        Limpiar
                    </button>
                ) : null}
            </div>

            {/* Tabla */}
            <div className="contenedor-tabla">
                <table className="tabla tabla-movil">
                    <thead>
                        <tr>
                            <th>Tipo</th>
                            <th>Color</th>
                            <th>Textura</th>
                            <th>Formato</th>
                            <th>Espesor</th>
                            <th>Medida</th>
                            <th style={{ textAlign: 'right' }}>Cantidad</th>
                            <th style={{ textAlign: 'right' }}>P. Promedio</th>
                            <th style={{ textAlign: 'right' }}>Valor Total</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cargando ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <tr key={i}>
                                    {Array.from({ length: 10 }).map((_, j) => (
                                        <td key={j}><div className="skeleton skeleton-celda" /></td>
                                    ))}
                                </tr>
                            ))
                        ) : datos.length === 0 ? (
                            <tr>
                                <td colSpan={10}>
                                    <div className="estado-vacio">
                                        <p>No se encontraron productos con los filtros aplicados</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            datos.map(item => (
                                <tr
                                    key={item.producto_id}
                                    className={[
                                        esSinStock(item.cantidad_disponible) ? 'fila-sin-stock' : '',
                                        esCritico(item.cantidad_disponible) && !esSinStock(item.cantidad_disponible) ? 'fila-critica' : ''
                                    ].join(' ').trim()}
                                >
                                    <td data-label="Tipo"><span className="badge badge-activo">{item.tipo}</span></td>
                                    <td data-label="Color">{item.color}</td>
                                    <td data-label="Textura">{item.textura}</td>
                                    <td data-label="Formato">{item.formato}</td>
                                    <td data-label="Espesor" className="cifra">{item.espesor}</td>
                                    <td data-label="Medida" className="cifra">{item.medida}</td>
                                    <td
                                        data-label="Cantidad"
                                        className={`cifra ${esSinStock(item.cantidad_disponible) ? 'stock-sin-stock'
                                                : esCritico(item.cantidad_disponible) ? 'stock-critico' : ''
                                            }`}
                                        style={{ textAlign: 'right', fontWeight: 600 }}
                                    >
                                        {formatearNum(item.cantidad_disponible)}
                                    </td>
                                    <td data-label="P. Promedio" className="cifra" style={{ textAlign: 'right' }}>
                                        {formatearMoneda(item.precio_compra_promedio)}
                                    </td>
                                    <td data-label="Valor Total" className="cifra" style={{ textAlign: 'right', fontWeight: 500 }}>
                                        {formatearMoneda(item.valor_total)}
                                    </td>
                                    <td data-label="Estado">
                                        {esSinStock(item.cantidad_disponible)
                                            ? <span className="badge badge-sin-stock" title={`Stock mínimo: ${stockMinimo} unidades`}>
                                                <AlertTriangle size={10} /> Sin stock
                                            </span>
                                            : esCritico(item.cantidad_disponible)
                                                ? <span className="badge badge-stock-bajo" title={`Stock mínimo: ${stockMinimo} unidades`}>
                                                    <AlertTriangle size={10} /> Crítico
                                                </span>
                                                : <span className="badge badge-stock-ok">OK</span>
                                        }
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Paginación */}
                {paginacion && (
                    <div className="paginacion">
                        <span className="paginacion-info mono">
                            {paginacion.total} registros · Página {paginacion.page} de {paginacion.totalPages}
                        </span>
                        <div className="paginacion-controles">
                            <button className="btn btn-secundario btn-sm" disabled={!paginacion.hasPrevPage} onClick={paginaAnterior} id="btn-pag-anterior">
                                ← Anterior
                            </button>
                            <button className="btn btn-secundario btn-sm" disabled={!paginacion.hasNextPage} onClick={() => paginaSiguiente(paginacion)} id="btn-pag-siguiente">
                                Siguiente →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InventarioPage;
