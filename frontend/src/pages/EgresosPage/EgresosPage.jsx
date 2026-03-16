import React, { useEffect, useState, useCallback } from 'react';
import { Plus, X } from 'lucide-react';
import api from '../../services/api.js';
import { useToast } from '../../components/Toast/Toast.jsx';
import { usePaginacion } from '../../hooks/usePaginacion.js';
import './EgresosPage.css';

const formatearFecha = (f) => f ? new Date(f).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

const MOTIVOS = ['VENTA', 'AJUSTE', 'CORTE', 'DEVOLUCION'];

const ModalEgreso = ({ onCerrar, onGuardar, productos }) => {
    const [form, setForm] = useState({ producto_id: '', cantidad: '', motivo: 'VENTA', referencia_documento: '', observaciones: '' });
    const [stockDisponible, setStockDisponible] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');

    const manejarCambio = e => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    };

    const manejarProducto = async e => {
        const id = e.target.value;
        setForm(prev => ({ ...prev, producto_id: id, cantidad: '' }));
        setStockDisponible(null);
        if (!id) return;
        try {
            const r = await api.get('/inventario', { params: { producto_id: id, limit: 1 } });
            const item = r.data.data?.find(i => i.producto_id === id);
            if (item) setStockDisponible(parseFloat(item.cantidad_disponible));
        } catch { /* silenciar */ }
    };

    const cantidadInvalida = form.cantidad && stockDisponible !== null && parseFloat(form.cantidad) > stockDisponible;

    const manejarSubmit = async e => {
        e.preventDefault();
        if (cantidadInvalida) { setError('Cantidad supera el stock disponible'); return; }
        if (!form.producto_id || !form.cantidad) { setError('Producto y cantidad son requeridos'); return; }
        setCargando(true);
        try {
            await onGuardar({ ...form, cantidad: parseFloat(form.cantidad) });
        } catch (err) {
            setError(err.response?.data?.message || 'Error al registrar salida');
        } finally { setCargando(false); }
    };

    return (
        <div className="overlay-modal" onClick={onCerrar}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-encabezado">
                    <h2 className="modal-titulo">Registrar Salida</h2>
                    <button className="btn-icono" onClick={onCerrar} id="btn-cerrar-modal-egreso"><X size={18} /></button>
                </div>
                <form onSubmit={manejarSubmit}>
                    <div className="modal-cuerpo">
                        <div className="campo-formulario">
                            <label className="etiqueta" htmlFor="eg-producto">Producto</label>
                            <select className="select-campo" id="eg-producto" name="producto_id" value={form.producto_id} onChange={manejarProducto} required>
                                <option value="">Seleccionar producto...</option>
                                {productos.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.tipo} — {p.color} / {p.textura} / {p.formato} / {p.espesor} / {p.medida}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {stockDisponible !== null && (
                            <p className="egreso-stock-info">Stock disponible: <strong className="cifra">{stockDisponible}</strong> unidades</p>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div className="campo-formulario">
                                <label className="etiqueta" htmlFor="eg-cantidad">Cantidad a retirar</label>
                                <input className={`input ${cantidadInvalida ? 'error-input' : ''}`} id="eg-cantidad" type="number" name="cantidad" min="0.01" step="0.01" value={form.cantidad} onChange={manejarCambio} placeholder="0" required />
                                {cantidadInvalida && <span className="mensaje-error-campo">Supera el stock disponible</span>}
                            </div>
                            <div className="campo-formulario">
                                <label className="etiqueta" htmlFor="eg-motivo">Motivo</label>
                                <select className="select-campo" id="eg-motivo" name="motivo" value={form.motivo} onChange={manejarCambio}>
                                    {MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="campo-formulario">
                            <label className="etiqueta" htmlFor="eg-ref">Referencia documento</label>
                            <input className="input" id="eg-ref" type="text" name="referencia_documento" value={form.referencia_documento} onChange={manejarCambio} placeholder="Ej: OV-2024-001" />
                        </div>
                        <div className="campo-formulario">
                            <label className="etiqueta" htmlFor="eg-obs">Observaciones</label>
                            <textarea className="textarea-campo" id="eg-obs" name="observaciones" value={form.observaciones} onChange={manejarCambio} rows={2} />
                        </div>
                        {error && <div className="login-error"><p>{error}</p></div>}
                    </div>
                    <div className="modal-pie">
                        <button type="button" className="btn btn-secundario" onClick={onCerrar} id="btn-cancelar-egreso">Cancelar</button>
                        <button type="submit" className="btn btn-primario" disabled={cargando || cantidadInvalida} id="btn-guardar-egreso">
                            {cargando ? 'Guardando...' : 'Registrar salida'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EgresosPage = () => {
    const [egresos, setEgresos] = useState([]);
    const [paginacion, setPaginacion] = useState(null);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const { exito, error: errorToast } = useToast();
    const { pagina, limite, paginaSiguiente, paginaAnterior } = usePaginacion(20);

    const cargarDatos = useCallback(async () => {
        setCargando(true);
        try {
            const [rEgresos, rProductos] = await Promise.all([
                api.get('/egresos', { params: { page: pagina, limit: limite } }),
                api.get('/productos', { params: { activo: 'true', limit: 200 } })
            ]);
            setEgresos(rEgresos.data.data || []);
            setPaginacion(rEgresos.data.pagination);
            setProductos(rProductos.data.data || []);
        } catch { errorToast('Error al cargar datos'); }
        finally { setCargando(false); }
    }, [pagina, limite]);

    useEffect(() => { cargarDatos(); }, [cargarDatos]);

    const guardarEgreso = async (datos) => {
        await api.post('/egresos', datos);
        exito('Salida registrada correctamente');
        setMostrarModal(false);
        cargarDatos();
    };

    const BADGE_MOTIVO = { VENTA: 'badge-activo', AJUSTE: 'badge-operador', CORTE: 'badge-lectura', DEVOLUCION: 'badge-inactivo' };

    return (
        <div>
            <div className="encabezado-pagina">
                <div>
                    <h1 className="titulo-pagina">Salidas</h1>
                    <p className="subtitulo-pagina">Registro de egresos del almacén</p>
                </div>
                <button className="btn btn-primario" onClick={() => setMostrarModal(true)} id="btn-nuevo-egreso">
                    <Plus size={16} /> Nueva salida
                </button>
            </div>
            <div className="contenedor-tabla">
                <table className="tabla tabla-movil">
                    <thead>
                        <tr>
                            <th>Fecha</th><th>Producto</th><th>Motivo</th>
                            <th style={{ textAlign: 'right' }}>Cantidad</th>
                            <th>Referencia</th><th>Registrado por</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cargando ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j}><div className="skeleton skeleton-celda" /></td>)}</tr>
                            ))
                        ) : egresos.length === 0 ? (
                            <tr><td colSpan={6}><div className="estado-vacio"><p>No hay salidas registradas</p></div></td></tr>
                        ) : egresos.map(eg => (
                            <tr key={eg.id}>
                                <td data-label="Fecha" className="cifra">{formatearFecha(eg.fecha)}</td>
                                <td data-label="Producto">{eg.productos ? `${eg.productos.tipo} — ${eg.productos.color} / ${eg.productos.textura} / ${eg.productos.formato} / ${eg.productos.espesor} / ${eg.productos.medida}` : '—'}</td>
                                <td data-label="Motivo"><span className={`badge ${BADGE_MOTIVO[eg.motivo] || 'badge-inactivo'}`}>{eg.motivo}</span></td>
                                <td data-label="Cantidad" className="cifra" style={{ textAlign: 'right', fontWeight: 600 }}>{eg.cantidad}</td>
                                <td data-label="Referencia">{eg.referencia_documento || '—'}</td>
                                <td data-label="Registrado por">{eg.usuarios?.nombre || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {paginacion && (
                    <div className="paginacion">
                        <span className="paginacion-info mono">{paginacion.total} registros · Pág. {paginacion.page}/{paginacion.totalPages}</span>
                        <div className="paginacion-controles">
                            <button className="btn btn-secundario btn-sm" disabled={!paginacion.hasPrevPage} onClick={paginaAnterior} id="btn-eg-pag-ant">← Anterior</button>
                            <button className="btn btn-secundario btn-sm" disabled={!paginacion.hasNextPage} onClick={() => paginaSiguiente(paginacion)} id="btn-eg-pag-sig">Siguiente →</button>
                        </div>
                    </div>
                )}
            </div>
            {mostrarModal && <ModalEgreso onCerrar={() => setMostrarModal(false)} onGuardar={guardarEgreso} productos={productos} />}
        </div>
    );
};

export default EgresosPage;
