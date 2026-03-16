import React, { useEffect, useState, useCallback } from 'react';
import { FileText, Download, FileSpreadsheet } from 'lucide-react';
import api from '../../services/api.js';
import { useToast } from '../../components/Toast/Toast.jsx';
import './ReportesPage.css';

// ── Librerias de exportación ───────────────────────────────────────────────
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportarExcel } from '../../utils/exportarExcel.js';

const formatearFecha = (f) =>
    f ? new Date(f).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
const formatearMoneda = (v) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v || 0);
const hoy = () => new Date().toISOString().split('T')[0];

// ── Cabeceras y mapeo de datos por tipo de reporte ─────────────────────────
const COLUMNAS = {
    movimientos: {
        cabeceras: ['Tipo', 'Fecha', 'Producto', 'Entrada', 'Salida', 'Referencia', 'Usuario'],
        fila: (m) => {
            const desc = m.tipo ? `${m.tipo} — ${m.color} / ${m.textura} / ${m.formato} / ${m.espesor} / ${m.medida}` : m.producto_id;
            const tipoMostrar = m.tipo_movimiento === 'EGRESO' ? 'SALIDA' : (m.tipo_movimiento || '');
            return [
                tipoMostrar,
                formatearFecha(m.fecha),
                desc,
                m.cantidad_entrada || '',
                m.cantidad_salida || '',
                m.referencia || '',
                m.usuario_nombre || ''
            ];
        }
    },
    stock: {
        cabeceras: ['Tipo', 'Color', 'Textura', 'Formato', 'Espesor', 'Medida', 'Cantidad', 'P. Promedio', 'Valor'],
        fila: (s) => [
            s.tipo, s.color, s.textura, s.formato, s.espesor, s.medida,
            s.cantidad_disponible,
            formatearMoneda(s.precio_compra_promedio),
            formatearMoneda(s.valor_total)
        ]
    },
    rotacion: {
        cabeceras: ['Producto', 'Total Movimientos'],
        fila: (r) => [r.producto_descripcion || r.producto_id, r.total_movimientos]
    }
};

const NOMBRES_REPORTE = {
    movimientos: 'Movimientos de Inventario',
    stock: 'Stock Actual',
    rotacion: 'Rotacion de Productos'
};

// ── Exportar PDF ───────────────────────────────────────────────────────────
const exportarPDF = (datos, tipoReporte, filtros) => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const { cabeceras, fila } = COLUMNAS[tipoReporte];
    const nombreReporte = NOMBRES_REPORTE[tipoReporte];

    // Encabezado del documento
    doc.setFillColor(28, 28, 28);
    doc.rect(0, 0, 297, 18, 'F');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('MEI — Modulo de Inventarios', 10, 11);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(nombreReporte, 180, 11);

    // Subtitulo con rango de fechas
    doc.setTextColor(75, 75, 75);
    doc.setFontSize(8);
    let subtitulo = `Generado: ${new Date().toLocaleString('es-CO')}`;
    if (filtros.fecha_desde) subtitulo += ` | Desde: ${filtros.fecha_desde}`;
    if (filtros.fecha_hasta) subtitulo += ` | Hasta: ${filtros.fecha_hasta}`;
    doc.text(subtitulo, 10, 24);

    // Preparar filas de datos
    const bodyDatos = datos.map(fila);
    if (tipoReporte === 'stock') {
        const totalInventario = datos.reduce((sum, item) => sum + (Number(item.valor_total) || 0), 0);
        bodyDatos.push([{ content: 'TOTAL INVENTARIO', colSpan: 8, styles: { halign: 'right', fontStyle: 'bold' } }, { content: formatearMoneda(totalInventario), styles: { fontStyle: 'bold' } }]);
    }

    // Tabla de datos
    autoTable(doc, {
        startY: 28,
        head: [cabeceras],
        body: bodyDatos,
        headStyles: {
            fillColor: [74, 85, 104],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 8
        },
        bodyStyles: { fontSize: 7.5, textColor: [45, 45, 45] },
        alternateRowStyles: { fillColor: [248, 248, 247] },
        tableLineColor: [226, 226, 226],
        tableLineWidth: 0.1,
        margin: { left: 10, right: 10 }
    });

    doc.save(`mei_${tipoReporte}_${hoy()}.pdf`);
};

// ── Exportar XLSX (con estilos ExcelJS) ────────────────────────────────────
const ANCHOS = {
    movimientos: [14, 14, 45, 10, 10, 20, 20],
    stock: [12, 16, 14, 14, 10, 16, 12, 18, 18],
    rotacion: [45, 20],
};

const exportarXLSX = async (datos, tipoReporte, filtros) => {
    const { cabeceras, fila } = COLUMNAS[tipoReporte];
    let subtitulo = `Generado: ${new Date().toLocaleString('es-CO')}`;
    if (filtros.fecha_desde) subtitulo += ` | Desde: ${filtros.fecha_desde}`;
    if (filtros.fecha_hasta) subtitulo += ` | Hasta: ${filtros.fecha_hasta}`;

    const bodyDatos = datos.map(fila);
    if (tipoReporte === 'stock') {
        const totalInventario = datos.reduce((sum, item) => sum + (Number(item.valor_total) || 0), 0);
        bodyDatos.push(['TOTAL INVENTARIO', '', '', '', '', '', '', '', formatearMoneda(totalInventario)]);
    }

    await exportarExcel({
        nombreArchivo: `mei_${tipoReporte}_${hoy()}`,
        nombreHoja: NOMBRES_REPORTE[tipoReporte].slice(0, 31),
        titulo: `MEI — ${NOMBRES_REPORTE[tipoReporte]}`,
        subtitulo,
        cabeceras,
        anchos: ANCHOS[tipoReporte],
        filas: bodyDatos,
    });
};

// ── Componente principal ───────────────────────────────────────────────────
const ReportesPage = () => {
    const [tipoReporte, setTipoReporte] = useState('movimientos');
    const [formato, setFormato] = useState('pdf');
    const [datos, setDatos] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [generando, setGenerando] = useState(false);
    const [filtros, setFiltros] = useState({ fecha_desde: '', fecha_hasta: '', tipo_movimiento: '' });
    const { advertencia, exito: exitoToast } = useToast();

    const cargarReporte = useCallback(async () => {
        setCargando(true);
        try {
            const params = {};
            if (filtros.fecha_desde) params.fecha_desde = filtros.fecha_desde;
            if (filtros.fecha_hasta) params.fecha_hasta = filtros.fecha_hasta;

            let url = '';
            if (tipoReporte === 'movimientos') {
                url = '/reportes/movimientos';
                if (filtros.tipo_movimiento) params.tipo_movimiento = filtros.tipo_movimiento;
                params.limit = 500;
            } else if (tipoReporte === 'stock') {
                url = '/reportes/stock-actual';
            } else if (tipoReporte === 'rotacion') {
                url = '/reportes/rotacion';
            }

            const r = await api.get(url, { params });
            const rawData = r.data.data;
            setDatos(tipoReporte === 'stock' ? (rawData?.datos || []) : (Array.isArray(rawData) ? rawData : []));
        } catch { advertencia('Error al cargar datos del reporte'); }
        finally { setCargando(false); }
    }, [tipoReporte, filtros]);

    useEffect(() => { cargarReporte(); }, [cargarReporte]);

    const generarReporte = async () => {
        if (!datos.length) { advertencia('No hay datos para exportar'); return; }
        setGenerando(true);
        try {
            if (formato === 'pdf') {
                exportarPDF(datos, tipoReporte, filtros);
            } else {
                await exportarXLSX(datos, tipoReporte, filtros);
            }
            exitoToast(`Reporte exportado como ${formato.toUpperCase()}`);
        } catch {
            advertencia('Error al generar el reporte');
        } finally {
            setGenerando(false);
        }
    };

    const TIPOS_REPORTE = [
        { id: 'movimientos', etiqueta: 'Movimientos' },
        { id: 'stock', etiqueta: 'Stock Actual' },
        { id: 'rotacion', etiqueta: 'Rotacion' },
    ];

    return (
        <div>
            <div className="encabezado-pagina">
                <div>
                    <h1 className="titulo-pagina">Reportes</h1>
                    <p className="subtitulo-pagina">Generacion y exportacion de reportes del inventario</p>
                </div>
            </div>

            {/* Panel de configuracion del reporte */}
            <div className="reporte-panel-config">
                {/* Tipo de reporte */}
                <div className="reporte-config-grupo">
                    <label className="etiqueta">Tipo de reporte</label>
                    <div className="reporte-tipo-selector">
                        {TIPOS_REPORTE.map(t => (
                            <button
                                key={t.id}
                                className={`reporte-tipo-btn ${tipoReporte === t.id ? 'activo' : ''}`}
                                onClick={() => setTipoReporte(t.id)}
                                id={`btn-tipo-reporte-${t.id}`}
                            >
                                <FileText size={14} />
                                {t.etiqueta}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Formato de exportacion */}
                <div className="reporte-config-grupo">
                    <label className="etiqueta">Formato de exportacion</label>
                    <div className="reporte-formato-selector">
                        <button
                            className={`reporte-formato-btn ${formato === 'pdf' ? 'activo' : ''}`}
                            onClick={() => setFormato('pdf')}
                            id="btn-formato-pdf"
                        >
                            <FileText size={14} />
                            PDF
                        </button>
                        <button
                            className={`reporte-formato-btn ${formato === 'xlsx' ? 'activo' : ''}`}
                            onClick={() => setFormato('xlsx')}
                            id="btn-formato-xlsx"
                        >
                            <FileSpreadsheet size={14} />
                            Excel (XLSX)
                        </button>
                    </div>
                </div>

                {/* Filtros de fecha */}
                {tipoReporte !== 'stock' && (
                    <div className="reporte-config-grupo" style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                            <label className="etiqueta" style={{ display: 'block', marginBottom: 4 }}>Desde</label>
                            <input type="date" className="input" value={filtros.fecha_desde}
                                onChange={e => setFiltros(p => ({ ...p, fecha_desde: e.target.value }))}
                                id="filtro-fecha-desde" />
                        </div>
                        <div>
                            <label className="etiqueta" style={{ display: 'block', marginBottom: 4 }}>Hasta</label>
                            <input type="date" className="input" value={filtros.fecha_hasta}
                                onChange={e => setFiltros(p => ({ ...p, fecha_hasta: e.target.value }))}
                                id="filtro-fecha-hasta" />
                        </div>
                        {tipoReporte === 'movimientos' && (
                            <div>
                                <label className="etiqueta" style={{ display: 'block', marginBottom: 4 }}>Tipo movimiento</label>
                                <select className="select-campo" style={{ minWidth: 160 }}
                                    value={filtros.tipo_movimiento}
                                    onChange={e => setFiltros(p => ({ ...p, tipo_movimiento: e.target.value }))}
                                    id="filtro-tipo-movimiento">
                                    <option value="">Todos</option>
                                    <option value="INGRESO">Ingresos</option>
                                    <option value="EGRESO">Salidas</option>
                                    <option value="AJUSTE">Ajustes</option>
                                </select>
                            </div>
                        )}
                    </div>
                )}

                {/* Boton generar */}
                <div className="reporte-config-grupo reporte-btn-container">
                    <button
                        className="btn btn-primario"
                        onClick={generarReporte}
                        disabled={generando || cargando || !datos.length}
                        id="btn-generar-reporte"
                    >
                        <Download size={15} />
                        {generando ? 'Generando...' : `Descargar ${formato.toUpperCase()}`}
                    </button>
                    <span className="reporte-conteo mono">
                        {cargando ? 'Cargando...' : `${datos.length} reg. en vista previa`}
                    </span>
                </div>
            </div>

            {/* Vista previa */}
            <div className="contenedor-tabla">
                <table className="tabla tabla-movil">
                    <thead>
                        {tipoReporte === 'movimientos' && (
                            <tr><th>Tipo</th><th>Fecha</th><th>Producto</th><th style={{ textAlign: 'right' }}>Entrada</th><th style={{ textAlign: 'right' }}>Salida</th><th>Referencia</th><th>Usuario</th></tr>
                        )}
                        {tipoReporte === 'stock' && (
                            <tr><th>Tipo</th><th>Color</th><th>Textura</th><th>Formato</th><th>Espesor</th><th>Medida</th><th style={{ textAlign: 'right' }}>Cantidad</th><th style={{ textAlign: 'right' }}>P. Promedio</th><th style={{ textAlign: 'right' }}>Valor</th></tr>
                        )}
                        {tipoReporte === 'rotacion' && (
                            <tr><th>Producto</th><th style={{ textAlign: 'right' }}>Total Movimientos</th></tr>
                        )}
                    </thead>
                    <tbody>
                        {cargando ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j}><div className="skeleton skeleton-celda" /></td>)}</tr>
                            ))
                        ) : datos.length === 0 ? (
                            <tr><td colSpan={9}><div className="estado-vacio"><p>No hay datos con los filtros seleccionados</p></div></td></tr>
                        ) : tipoReporte === 'movimientos' ? datos.map((m, i) => (
                            <tr key={i}>
                                <td data-label="Tipo">
                                    <span className={`badge ${m.tipo_movimiento === 'INGRESO' ? 'badge-stock-ok' : m.tipo_movimiento === 'EGRESO' ? 'badge-stock-bajo' : 'badge-operador'}`}>
                                        {m.tipo_movimiento === 'EGRESO' ? 'SALIDA' : m.tipo_movimiento}
                                    </span>
                                </td>
                                <td data-label="Fecha" className="cifra">{formatearFecha(m.fecha)}</td>
                                <td data-label="Producto" style={{ fontSize: '0.85rem' }}>
                                    {m.tipo
                                        ? `${m.tipo} — ${m.color} / ${m.textura} / ${m.formato} / ${m.espesor} / ${m.medida}`
                                        : m.producto_id}
                                </td>
                                <td data-label="Entrada" className="cifra" style={{ textAlign: 'right', color: '#166534' }}>{m.cantidad_entrada || ''}</td>
                                <td data-label="Salida" className="cifra" style={{ textAlign: 'right', color: '#B91C1C' }}>{m.cantidad_salida || ''}</td>
                                <td data-label="Referencia">{m.referencia || '—'}</td>
                                <td data-label="Usuario">{m.usuario_nombre || '—'}</td>
                            </tr>
                        )) : tipoReporte === 'stock' ? datos.map((s, i) => (
                            <tr key={i}>
                                <td data-label="Tipo"><span className="badge badge-activo">{s.tipo}</span></td>
                                <td data-label="Color">{s.color}</td><td data-label="Textura">{s.textura}</td><td data-label="Formato">{s.formato}</td>
                                <td data-label="Espesor" className="cifra">{s.espesor}</td>
                                <td data-label="Medida" className="cifra">{s.medida}</td>
                                <td data-label="Cantidad" className="cifra" style={{ textAlign: 'right' }}>{s.cantidad_disponible}</td>
                                <td data-label="P. Promedio" className="cifra" style={{ textAlign: 'right' }}>{formatearMoneda(s.precio_compra_promedio)}</td>
                                <td data-label="Valor" className="cifra" style={{ textAlign: 'right', fontWeight: 600 }}>{formatearMoneda(s.valor_total)}</td>
                            </tr>
                        )) : datos.map((r, i) => (
                            <tr key={i}>
                                <td data-label="Producto" style={{ fontSize: '0.85rem' }}>{r.producto_descripcion || r.producto_id}</td>
                                <td data-label="Total Movimientos" className="cifra" style={{ textAlign: 'right', fontWeight: 600 }}>{r.total_movimientos}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ReportesPage;
