import React, { useEffect, useState, useCallback } from 'react';
import { Plus, X } from 'lucide-react';
import api from '../../services/api.js';
import { useToast } from '../../components/Toast/Toast.jsx';
import { usePaginacion } from '../../hooks/usePaginacion.js';
import './IngresosPage.css';

const formatearFecha = (f) => f ? new Date(f).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
const formatearMoneda = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v || 0);

const ModalIngreso = ({ onCerrar, onGuardar, productos, proveedores }) => {
    const [form, setForm] = useState({
        producto_id: '', proveedor_id: '', cantidad: '',
        precio_compra_unitario: '', numero_factura: '', observaciones: ''
    });
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');

    const manejarCambio = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const manejarSubmit = async e => {
        e.preventDefault();
        if (!form.producto_id || !form.cantidad || !form.precio_compra_unitario) {
            setError('Producto, cantidad y precio son obligatorios');
            return;
        }
        setCargando(true);
        try {
            await onGuardar({
                ...form,
                cantidad: parseFloat(form.cantidad),
                precio_compra_unitario: parseFloat(form.precio_compra_unitario),
                proveedor_id: form.proveedor_id || null
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Error al registrar ingreso');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="overlay-modal" onClick={onCerrar}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-encabezado">
                    <h2 className="modal-titulo">Registrar Ingreso</h2>
                    <button className="btn-icono" onClick={onCerrar} id="btn-cerrar-modal-ingreso"><X size={18} /></button>
                </div>
                <form onSubmit={manejarSubmit}>
                    <div className="modal-cuerpo">
                        <div className="campo-formulario">
                            <label className="etiqueta" htmlFor="ing-producto">Producto</label>
                            <select className="select-campo" id="ing-producto" name="producto_id" value={form.producto_id} onChange={manejarCambio} required>
                                <option value="">Seleccionar producto...</option>
                                {productos.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.tipo} — {p.color} / {p.textura} / {p.formato} / {p.espesor} / {p.medida}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="campo-formulario">
                            <label className="etiqueta" htmlFor="ing-proveedor">Proveedor (opcional)</label>
                            <select className="select-campo" id="ing-proveedor" name="proveedor_id" value={form.proveedor_id} onChange={manejarCambio}>
                                <option value="">Sin proveedor específico</option>
                                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div className="campo-formulario">
                                <label className="etiqueta" htmlFor="ing-cantidad">Cantidad</label>
                                <input className="input" id="ing-cantidad" type="number" name="cantidad" min="0.01" step="0.01" value={form.cantidad} onChange={manejarCambio} placeholder="0" required />
                            </div>
                            <div className="campo-formulario">
                                <label className="etiqueta" htmlFor="ing-precio">Precio unitario compra</label>
                                <input className="input" id="ing-precio" type="number" name="precio_compra_unitario" min="0" step="0.01" value={form.precio_compra_unitario} onChange={manejarCambio} placeholder="0.00" required />
                            </div>
                        </div>
                        <div className="campo-formulario">
                            <label className="etiqueta" htmlFor="ing-factura">Número de factura</label>
                            <input className="input" id="ing-factura" type="text" name="numero_factura" value={form.numero_factura} onChange={manejarCambio} placeholder="FAC-001" />
                        </div>
                        <div className="campo-formulario">
                            <label className="etiqueta" htmlFor="ing-obs">Observaciones</label>
                            <textarea className="textarea-campo" id="ing-obs" name="observaciones" value={form.observaciones} onChange={manejarCambio} rows={2} placeholder="Notas adicionales..." />
                        </div>
                        {error && <div className="login-error"><p>{error}</p></div>}
                    </div>
                    <div className="modal-pie">
                        <button type="button" className="btn btn-secundario" onClick={onCerrar} id="btn-cancelar-ingreso">Cancelar</button>
                        <button type="submit" className="btn btn-primario" disabled={cargando} id="btn-guardar-ingreso">
                            {cargando ? 'Guardando...' : 'Registrar ingreso'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const IngresosPage = () => {
    const [ingresos, setIngresos] = useState([]);
    const [paginacion, setPaginacion] = useState(null);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [productos, setProductos] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [cargando, setCargando] = useState(true);
    const { exito, error: errorToast } = useToast();
    const { pagina, limite, paginaSiguiente, paginaAnterior } = usePaginacion(20);

    const cargarDatos = useCallback(async () => {
        setCargando(true);
        try {
            const [rIngresos, rProductos, rProveedores] = await Promise.all([
                api.get('/ingresos', { params: { page: pagina, limit: limite } }),
                api.get('/productos', { params: { activo: 'true', limit: 200 } }),
                api.get('/proveedores', { params: { activo: 'true', limit: 200 } })
            ]);
            setIngresos(rIngresos.data.data || []);
            setPaginacion(rIngresos.data.pagination);
            setProductos(rProductos.data.data || []);
            setProveedores(rProveedores.data.data || []);
        } catch { errorToast('Error al cargar datos'); }
        finally { setCargando(false); }
    }, [pagina, limite]);

    useEffect(() => { cargarDatos(); }, [cargarDatos]);

    const guardarIngreso = async (datos) => {
        await api.post('/ingresos', datos);
        exito('Ingreso registrado correctamente');
        setMostrarModal(false);
        cargarDatos();
    };

    return (
        <div>
            <div className="encabezado-pagina">
                <div>
                    <h1 className="titulo-pagina">Ingresos</h1>
                    <p className="subtitulo-pagina">Registro de entradas al almacén</p>
                </div>
                <button className="btn btn-primario" onClick={() => setMostrarModal(true)} id="btn-nuevo-ingreso">
                    <Plus size={16} /> Nuevo ingreso
                </button>
            </div>

            <div className="contenedor-tabla">
                <table className="tabla tabla-movil">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Producto</th>
                            <th>Proveedor</th>
                            <th style={{ textAlign: 'right' }}>Cantidad</th>
                            <th style={{ textAlign: 'right' }}>Precio unitario</th>
                            <th style={{ textAlign: 'right' }}>Total</th>
                            <th>Factura</th>
                            <th>Registrado por</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cargando ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j}><div className="skeleton skeleton-celda" /></td>)}</tr>
                            ))
                        ) : ingresos.length === 0 ? (
                            <tr><td colSpan={8}><div className="estado-vacio"><p>No hay ingresos registrados</p></div></td></tr>
                        ) : (
                            ingresos.map(ing => (
                                <tr key={ing.id}>
                                    <td data-label="Fecha" className="cifra">{formatearFecha(ing.fecha)}</td>
                                    <td data-label="Producto">
                                        {ing.productos
                                            ? `${ing.productos.tipo} — ${ing.productos.color} / ${ing.productos.textura} / ${ing.productos.formato} / ${ing.productos.espesor} / ${ing.productos.medida}`
                                            : '—'}
                                    </td>
                                    <td data-label="Proveedor">{ing.proveedores?.nombre || '—'}</td>
                                    <td data-label="Cantidad" className="cifra" style={{ textAlign: 'right' }}>{ing.cantidad}</td>
                                    <td data-label="Precio unitario" className="cifra" style={{ textAlign: 'right' }}>{formatearMoneda(ing.precio_compra_unitario)}</td>
                                    <td data-label="Total" className="cifra" style={{ textAlign: 'right', fontWeight: 600 }}>
                                        {formatearMoneda(ing.cantidad * ing.precio_compra_unitario)}
                                    </td>
                                    <td data-label="Factura">{ing.numero_factura || '—'}</td>
                                    <td data-label="Registrado por">{ing.usuarios?.nombre || '—'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {paginacion && (
                    <div className="paginacion">
                        <span className="paginacion-info mono">{paginacion.total} registros · Pág. {paginacion.page}/{paginacion.totalPages}</span>
                        <div className="paginacion-controles">
                            <button className="btn btn-secundario btn-sm" disabled={!paginacion.hasPrevPage} onClick={paginaAnterior} id="btn-ing-pag-ant">← Anterior</button>
                            <button className="btn btn-secundario btn-sm" disabled={!paginacion.hasNextPage} onClick={() => paginaSiguiente(paginacion)} id="btn-ing-pag-sig">Siguiente →</button>
                        </div>
                    </div>
                )}
            </div>

            {mostrarModal && (
                <ModalIngreso
                    onCerrar={() => setMostrarModal(false)}
                    onGuardar={guardarIngreso}
                    productos={productos}
                    proveedores={proveedores}
                />
            )}
        </div>
    );
};

export default IngresosPage;
