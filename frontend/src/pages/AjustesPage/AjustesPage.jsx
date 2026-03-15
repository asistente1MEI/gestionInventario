import React, { useEffect, useState, useCallback } from 'react';
import { Plus, X } from 'lucide-react';
import api from '../../services/api.js';
import { useToast } from '../../components/Toast/Toast.jsx';
import { usePaginacion } from '../../hooks/usePaginacion.js';
import './AjustesPage.css';

const formatearFecha = (f) => f ? new Date(f).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

const ModalAjuste = ({ onCerrar, onGuardar, productos }) => {
    const [form, setForm] = useState({ producto_id: '', cantidad_nueva: '', motivo: '' });
    const [stockActual, setStockActual] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');

    const manejarProducto = async e => {
        const id = e.target.value;
        setForm(prev => ({ ...prev, producto_id: id, cantidad_nueva: '' }));
        setStockActual(null);
        if (!id) return;
        try {
            const r = await api.get('/inventario', { params: { limit: 200 } });
            const item = r.data.data?.find(i => i.producto_id === id);
            if (item) setStockActual(parseFloat(item.cantidad_disponible));
        } catch { /* silenciar */ }
    };

    const manejarCambio = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const manejarSubmit = async e => {
        e.preventDefault();
        if (!form.producto_id || form.cantidad_nueva === '' || !form.motivo) {
            setError('Todos los campos son obligatorios');
            return;
        }
        if (form.motivo.length < 10) {
            setError('El motivo debe tener al menos 10 caracteres');
            return;
        }
        setCargando(true);
        try {
            await onGuardar({ ...form, cantidad_nueva: parseFloat(form.cantidad_nueva) });
        } catch (err) {
            setError(err.response?.data?.message || 'Error al registrar ajuste');
        } finally { setCargando(false); }
    };

    return (
        <div className="overlay-modal" onClick={onCerrar}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-encabezado">
                    <h2 className="modal-titulo">Ajuste de inventario</h2>
                    <button className="btn-icono" onClick={onCerrar} id="btn-cerrar-modal-ajuste"><X size={18} /></button>
                </div>
                <form onSubmit={manejarSubmit}>
                    <div className="modal-cuerpo">
                        <div className="ajuste-aviso">
                            Esta acción modifica el stock directamente y queda registrada en el histórico de auditoría.
                        </div>
                        <div className="campo-formulario">
                            <label className="etiqueta" htmlFor="aj-producto">Producto</label>
                            <select className="select-campo" id="aj-producto" name="producto_id" value={form.producto_id} onChange={manejarProducto} required>
                                <option value="">Seleccionar producto...</option>
                                {productos.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.tipo} — {p.color} / {p.textura} / {p.formato} / {p.espesor} / {p.medida}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {stockActual !== null && (
                            <div className="ajuste-stock-info">
                                Stock actual: <strong className="cifra">{stockActual}</strong> unidades
                            </div>
                        )}
                        <div className="campo-formulario">
                            <label className="etiqueta" htmlFor="aj-cantidad">Nueva cantidad en stock</label>
                            <input className="input" id="aj-cantidad" type="number" name="cantidad_nueva" min="0" step="0.01" value={form.cantidad_nueva} onChange={manejarCambio} placeholder="0" required />
                        </div>
                        <div className="campo-formulario">
                            <label className="etiqueta" htmlFor="aj-motivo">Motivo del ajuste (obligatorio, mín. 10 caracteres)</label>
                            <textarea className="textarea-campo" id="aj-motivo" name="motivo" value={form.motivo} onChange={manejarCambio} rows={3} placeholder="Describe detalladamente el motivo del ajuste..." required />
                        </div>
                        {error && <div className="login-error"><p>{error}</p></div>}
                    </div>
                    <div className="modal-pie">
                        <button type="button" className="btn btn-secundario" onClick={onCerrar} id="btn-cancelar-ajuste">Cancelar</button>
                        <button type="submit" className="btn btn-primario" disabled={cargando} id="btn-guardar-ajuste">
                            {cargando ? 'Guardando...' : 'Registrar ajuste'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AjustesPage = () => {
    const [ajustes, setAjustes] = useState([]);
    const [paginacion, setPaginacion] = useState(null);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const { exito, error: errorToast } = useToast();
    const { pagina, limite, paginaSiguiente, paginaAnterior } = usePaginacion(20);

    const cargarDatos = useCallback(async () => {
        setCargando(true);
        try {
            const [rAjustes, rProductos] = await Promise.all([
                api.get('/ajustes', { params: { page: pagina, limit: limite } }),
                api.get('/productos', { params: { activo: 'true', limit: 200 } })
            ]);
            setAjustes(rAjustes.data.data || []);
            setPaginacion(rAjustes.data.pagination);
            setProductos(rProductos.data.data || []);
        } catch { errorToast('Error al cargar ajustes'); }
        finally { setCargando(false); }
    }, [pagina, limite]);

    useEffect(() => { cargarDatos(); }, [cargarDatos]);

    const guardarAjuste = async (datos) => {
        await api.post('/ajustes', datos);
        exito('Ajuste registrado correctamente');
        setMostrarModal(false);
        cargarDatos();
    };

    return (
        <div>
            <div className="encabezado-pagina">
                <div>
                    <h1 className="titulo-pagina">Ajustes de Inventario</h1>
                    <p className="subtitulo-pagina">Correcciones manuales de stock con registro de auditoría</p>
                </div>
                <button className="btn btn-primario" onClick={() => setMostrarModal(true)} id="btn-nuevo-ajuste">
                    <Plus size={16} /> Nuevo ajuste
                </button>
            </div>
            <div className="contenedor-tabla">
                <table className="tabla tabla-movil">
                    <thead>
                        <tr>
                            <th>Fecha</th><th>Producto</th>
                            <th style={{ textAlign: 'right' }}>Cant. anterior</th>
                            <th style={{ textAlign: 'right' }}>Cant. nueva</th>
                            <th style={{ textAlign: 'right' }}>Diferencia</th>
                            <th>Motivo</th><th>Registrado por</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cargando ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j}><div className="skeleton skeleton-celda" /></td>)}</tr>
                            ))
                        ) : ajustes.length === 0 ? (
                            <tr><td colSpan={7}><div className="estado-vacio"><p>No hay ajustes registrados</p></div></td></tr>
                        ) : ajustes.map(a => (
                            <tr key={a.id}>
                                <td data-label="Fecha" className="cifra">{formatearFecha(a.fecha)}</td>
                                <td data-label="Producto">{a.productos ? `${a.productos.tipo} — ${a.productos.color}` : '—'}</td>
                                <td data-label="Cant. anterior" className="cifra" style={{ textAlign: 'right' }}>{a.cantidad_anterior}</td>
                                <td data-label="Cant. nueva" className="cifra" style={{ textAlign: 'right', fontWeight: 600 }}>{a.cantidad_nueva}</td>
                                <td data-label="Diferencia" className={`cifra ${a.diferencia > 0 ? 'ajuste-positivo' : a.diferencia < 0 ? 'ajuste-negativo' : ''}`} style={{ textAlign: 'right', fontWeight: 600 }}>
                                    {a.diferencia > 0 ? '+' : ''}{a.diferencia}
                                </td>
                                <td data-label="Motivo" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.motivo}>
                                    {a.motivo}
                                </td>
                                <td data-label="Registrado por">{a.usuarios?.nombre || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {paginacion && (
                    <div className="paginacion">
                        <span className="paginacion-info mono">{paginacion.total} ajustes · Pág. {paginacion.page}/{paginacion.totalPages}</span>
                        <div className="paginacion-controles">
                            <button className="btn btn-secundario btn-sm" disabled={!paginacion.hasPrevPage} onClick={paginaAnterior} id="btn-aj-pag-ant">← Anterior</button>
                            <button className="btn btn-secundario btn-sm" disabled={!paginacion.hasNextPage} onClick={() => paginaSiguiente(paginacion)} id="btn-aj-pag-sig">Siguiente →</button>
                        </div>
                    </div>
                )}
            </div>
            {mostrarModal && <ModalAjuste onCerrar={() => setMostrarModal(false)} onGuardar={guardarAjuste} productos={productos} />}
        </div>
    );
};

export default AjustesPage;
