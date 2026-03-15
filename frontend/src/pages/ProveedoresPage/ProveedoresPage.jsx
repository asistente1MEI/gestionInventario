import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import api from '../../services/api.js';
import { useToast } from '../../components/Toast/Toast.jsx';
import { usePaginacion } from '../../hooks/usePaginacion.js';
import { confirmarEliminar } from '../../utils/alerta.js';
import './ProveedoresPage.css';

const FormProveedor = ({ inicial = {}, onGuardar, onCerrar, cargando }) => {
    const [form, setForm] = useState({ nombre: '', ruc_nit: '', telefono: '', email: '', direccion: '', ciudad: '', ...inicial });
    const manejarCambio = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    return (
        <div className="overlay-modal" onClick={onCerrar}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-encabezado">
                    <h2 className="modal-titulo">{inicial.id ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
                    <button className="btn-icono" onClick={onCerrar} id="btn-cerrar-form-proveedor"><X size={18} /></button>
                </div>
                <div className="modal-cuerpo">
                    {[
                        { nombre: 'nombre', etiqueta: 'Nombre / Razón social', ph: 'Nombre del proveedor', required: true },
                        { nombre: 'ruc_nit', etiqueta: 'RUC / NIT', ph: '900123456-1' },
                        { nombre: 'telefono', etiqueta: 'Teléfono', ph: '+57 300 000 0000' },
                        { nombre: 'email', etiqueta: 'Email', ph: 'proveedor@empresa.com' },
                        { nombre: 'ciudad', etiqueta: 'Ciudad', ph: 'Bogotá' },
                        { nombre: 'direccion', etiqueta: 'Dirección', ph: 'Cra 15 # 80-20' },
                    ].map(({ nombre, etiqueta, ph }) => (
                        <div className="campo-formulario" key={nombre}>
                            <label className="etiqueta" htmlFor={`prov-${nombre}`}>{etiqueta}</label>
                            <input className="input" id={`prov-${nombre}`} name={nombre} value={form[nombre]} onChange={manejarCambio} placeholder={ph} />
                        </div>
                    ))}
                </div>
                <div className="modal-pie">
                    <button className="btn btn-secundario" onClick={onCerrar} id="btn-cancelar-proveedor">Cancelar</button>
                    <button className="btn btn-primario" disabled={cargando || !form.nombre} onClick={() => onGuardar(form)} id="btn-guardar-proveedor">
                        {cargando ? 'Guardando...' : (inicial.id ? 'Actualizar' : 'Crear proveedor')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ProveedoresPage = () => {
    const [proveedores, setProveedores] = useState([]);
    const [paginacion, setPaginacion] = useState(null);
    const [modal, setModal] = useState(null);
    const [cargandoModal, setCargandoModal] = useState(false);
    const [cargando, setCargando] = useState(true);
    const { exito, error: errorToast } = useToast();
    const { pagina, limite, paginaSiguiente, paginaAnterior } = usePaginacion(20);

    const cargarProveedores = useCallback(async () => {
        setCargando(true);
        try {
            const r = await api.get('/proveedores', { params: { page: pagina, limit: limite } });
            setProveedores(r.data.data || []);
            setPaginacion(r.data.pagination);
        } catch { errorToast('Error al cargar proveedores'); }
        finally { setCargando(false); }
    }, [pagina, limite]);

    useEffect(() => { cargarProveedores(); }, [cargarProveedores]);

    const guardarProveedor = async (datos) => {
        setCargandoModal(true);
        try {
            if (modal?.datos?.id) {
                await api.put(`/proveedores/${modal.datos.id}`, datos);
                exito('Proveedor actualizado');
            } else {
                await api.post('/proveedores', datos);
                exito('Proveedor creado');
            }
            setModal(null);
            cargarProveedores();
        } catch (err) {
            errorToast(err.response?.data?.message || 'Error al guardar');
        } finally { setCargandoModal(false); }
    };

    const pedirEliminarProveedor = async (proveedor) => {
        const confirmado = await confirmarEliminar(proveedor.nombre);
        if (!confirmado) return;
        try {
            await api.delete(`/proveedores/${proveedor.id}`);
            exito('Proveedor desactivado');
            cargarProveedores();
        } catch { errorToast('Error al desactivar'); }
    };

    return (
        <div>
            <div className="encabezado-pagina">
                <div>
                    <h1 className="titulo-pagina">Proveedores</h1>
                    <p className="subtitulo-pagina">Directorio de proveedores activos</p>
                </div>
                <button className="btn btn-primario" onClick={() => setModal({ tipo: 'nuevo', datos: {} })} id="btn-nuevo-proveedor">
                    <Plus size={16} /> Nuevo proveedor
                </button>
            </div>
            <div className="contenedor-tabla">
                <table className="tabla tabla-movil">
                    <thead>
                        <tr>
                            <th>Nombre</th><th>RUC / NIT</th><th>Teléfono</th><th>Email</th><th>Ciudad</th><th>Estado</th><th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cargando ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j}><div className="skeleton skeleton-celda" /></td>)}</tr>
                            ))
                        ) : proveedores.length === 0 ? (
                            <tr><td colSpan={7}><div className="estado-vacio"><p>No hay proveedores registrados</p></div></td></tr>
                        ) : proveedores.map(p => (
                            <tr key={p.id}>
                                <td data-label="Nombre" style={{ fontWeight: 500 }}>{p.nombre}</td>
                                <td data-label="RUC / NIT" className="cifra">{p.ruc_nit || '—'}</td>
                                <td data-label="Teléfono">{p.telefono || '—'}</td>
                                <td data-label="Email">{p.email || '—'}</td>
                                <td data-label="Ciudad">{p.ciudad || '—'}</td>
                                <td data-label="Estado"><span className={`badge ${p.activo ? 'badge-stock-ok' : 'badge-inactivo'}`}>{p.activo ? 'Activo' : 'Inactivo'}</span></td>
                                <td data-label="Acciones">
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <button className="btn-icono" title="Editar" onClick={() => setModal({ tipo: 'editar', datos: p })} id={`btn-editar-prov-${p.id}`}><Pencil size={14} /></button>
                                        <button className="btn-icono" title="Desactivar" onClick={() => pedirEliminarProveedor(p)} id={`btn-eliminar-prov-${p.id}`} style={{ color: '#B91C1C' }}><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {paginacion && (
                    <div className="paginacion">
                        <span className="paginacion-info mono">{paginacion.total} proveedores · Pág. {paginacion.page}/{paginacion.totalPages}</span>
                        <div className="paginacion-controles">
                            <button className="btn btn-secundario btn-sm" disabled={!paginacion.hasPrevPage} onClick={paginaAnterior} id="btn-prov-pag-ant">← Anterior</button>
                            <button className="btn btn-secundario btn-sm" disabled={!paginacion.hasNextPage} onClick={() => paginaSiguiente(paginacion)} id="btn-prov-pag-sig">Siguiente →</button>
                        </div>
                    </div>
                )}
            </div>

            {(modal?.tipo === 'nuevo' || modal?.tipo === 'editar') && (
                <FormProveedor inicial={modal.datos} onGuardar={guardarProveedor} onCerrar={() => setModal(null)} cargando={cargandoModal} />
            )}
        </div>
    );
};

export default ProveedoresPage;
