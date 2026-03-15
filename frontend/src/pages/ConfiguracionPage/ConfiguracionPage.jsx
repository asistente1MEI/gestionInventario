import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, ShieldCheck, Settings, Users, Lock, Unlock } from 'lucide-react';
import api from '../../services/api.js';
import { useToast } from '../../components/Toast/Toast.jsx';
import { usePaginacion } from '../../hooks/usePaginacion.js';
import './ConfiguracionPage.css';

const ROLES = ['ADMIN', 'OPERADOR', 'SOLO_LECTURA'];
const BADGE_ROL = { ADMIN: 'badge-admin', OPERADOR: 'badge-operador', SOLO_LECTURA: 'badge-lectura' };

const formatearFechaHora = (f) => f ? new Date(f).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const ModalUsuario = ({ inicial = {}, onGuardar, onCerrar, cargando }) => {
    const esEdicion = !!inicial.id;
    const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'OPERADOR', activo: true, ...inicial });
    const manejarCambio = e => {
        const valor = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm(prev => ({ ...prev, [e.target.name]: valor }));
    };

    return (
        <div className="overlay-modal" onClick={onCerrar}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-encabezado">
                    <h2 className="modal-titulo">{esEdicion ? 'Editar usuario' : 'Nuevo usuario'}</h2>
                    <button className="btn-icono" onClick={onCerrar} id="btn-cerrar-form-usuario">✕</button>
                </div>
                <div className="modal-cuerpo">
                    <div className="campo-formulario">
                        <label className="etiqueta" htmlFor="usr-nombre">Nombre completo</label>
                        <input className="input" id="usr-nombre" name="nombre" value={form.nombre} onChange={manejarCambio} placeholder="Nombre del usuario" required />
                    </div>
                    <div className="campo-formulario">
                        <label className="etiqueta" htmlFor="usr-email">Correo electrónico</label>
                        <input className="input" id="usr-email" name="email" type="email" value={form.email} onChange={manejarCambio} placeholder="correo@empresa.com" disabled={esEdicion} />
                    </div>
                    {!esEdicion && (
                        <div className="campo-formulario">
                            <label className="etiqueta" htmlFor="usr-password">Contraseña temporal</label>
                            <input className="input" id="usr-password" name="password" type="password" value={form.password} onChange={manejarCambio} placeholder="Mín. 8 chars, 1 mayúscula, 1 número" />
                        </div>
                    )}
                    <div className="campo-formulario">
                        <label className="etiqueta" htmlFor="usr-rol">Rol</label>
                        <select className="select-campo" id="usr-rol" name="rol" value={form.rol} onChange={manejarCambio}>
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    {esEdicion && (
                        <div className="campo-formulario" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <input type="checkbox" id="usr-activo" name="activo" checked={form.activo} onChange={manejarCambio} />
                            <label className="etiqueta" htmlFor="usr-activo" style={{ margin: 0 }}>Usuario activo</label>
                        </div>
                    )}
                </div>
                <div className="modal-pie">
                    <button className="btn btn-secundario" onClick={onCerrar} id="btn-cancelar-usuario">Cancelar</button>
                    <button className="btn btn-primario" disabled={cargando || !form.nombre} onClick={() => onGuardar(form)} id="btn-guardar-usuario">
                        {cargando ? 'Guardando...' : (esEdicion ? 'Actualizar' : 'Crear usuario')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ConfiguracionPage = () => {
    const [tabActiva, setTabActiva] = useState('usuarios');
    const [usuarios, setUsuarios] = useState([]);
    const [auditoria, setAuditoria] = useState([]);
    const [paginacion, setPaginacion] = useState(null);
    const [paginacionAuditoria, setPaginacionAuditoria] = useState(null);
    const [modal, setModal] = useState(null);
    const [cargandoModal, setCargandoModal] = useState(false);
    const [cargando, setCargando] = useState(true);
    const [stockMinimo, setStockMinimo] = useState('5');
    const { exito, error: errorToast } = useToast();
    const { pagina, limite, paginaSiguiente, paginaAnterior } = usePaginacion(20);
    const { pagina: pagAudit, limite: limAudit, paginaSiguiente: sigAudit, paginaAnterior: antAudit } = usePaginacion(20);

    const cargarUsuarios = useCallback(async () => {
        setCargando(true);
        try {
            const r = await api.get('/usuarios', { params: { page: pagina, limit: limite } });
            setUsuarios(r.data.data || []);
            setPaginacion(r.data.pagination);
        } catch { errorToast('Error al cargar usuarios'); }
        finally { setCargando(false); }
    }, [pagina, limite]);

    const cargarAuditoria = useCallback(async () => {
        setCargando(true);
        try {
            const r = await api.get('/usuarios/auditoria/logins', { params: { page: pagAudit, limit: limAudit } });
            setAuditoria(r.data.data || []);
            setPaginacionAuditoria(r.data.pagination);
        } catch { errorToast('Error al cargar auditoría'); }
        finally { setCargando(false); }
    }, [pagAudit, limAudit]);

    const cargarConfig = async () => {
        try {
            const r = await api.get('/usuarios/configuracion/stock_minimo_alerta');
            setStockMinimo(r.data.data?.valor || '5');
        } catch { /* silenciar */ }
    };

    useEffect(() => {
        if (tabActiva === 'usuarios') cargarUsuarios();
        else if (tabActiva === 'auditoria') cargarAuditoria();
        else if (tabActiva === 'config') cargarConfig();
    }, [tabActiva, cargarUsuarios, cargarAuditoria]);

    const guardarUsuario = async (datos) => {
        setCargandoModal(true);
        try {
            if (modal?.datos?.id) {
                await api.put(`/usuarios/${modal.datos.id}`, datos);
                exito('Usuario actualizado');
            } else {
                await api.post('/usuarios', datos);
                exito('Usuario creado — deberá cambiar contraseña al primer ingreso');
            }
            setModal(null);
            cargarUsuarios();
        } catch (err) {
            errorToast(err.response?.data?.message || 'Error al guardar usuario');
        } finally { setCargandoModal(false); }
    };

    const desbloquear = async (id) => {
        try {
            await api.post(`/usuarios/${id}/desbloquear`);
            exito('Cuenta desbloqueada');
            cargarUsuarios();
        } catch { errorToast('Error al desbloquear'); }
    };

    const guardarConfig = async () => {
        try {
            await api.put('/usuarios/configuracion/stock_minimo_alerta', { valor: stockMinimo });
            exito('Umbral de stock mínimo actualizado');
        } catch { errorToast('Error al guardar configuración'); }
    };

    return (
        <div>
            <div className="encabezado-pagina">
                <div>
                    <h1 className="titulo-pagina">Configuración</h1>
                    <p className="subtitulo-pagina">Gestión de usuarios, auditoría y parámetros del sistema</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="reportes-tabs" style={{ marginBottom: 24 }}>
                {[
                    { id: 'usuarios', etiqueta: 'Usuarios', icono: Users },
                    { id: 'auditoria', etiqueta: 'Auditoría', icono: ShieldCheck },
                    { id: 'config', etiqueta: 'Parámetros', icono: Settings },
                ].map(({ id, etiqueta, icono: Icono }) => (
                    <button key={id} className={`reportes-tab ${tabActiva === id ? 'reportes-tab-activa' : ''}`} onClick={() => setTabActiva(id)} id={`tab-config-${id}`}>
                        <Icono size={14} /> {etiqueta}
                    </button>
                ))}
            </div>

            {/* Tab Usuarios */}
            {tabActiva === 'usuarios' && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                        <button className="btn btn-primario" onClick={() => setModal({ tipo: 'nuevo', datos: {} })} id="btn-nuevo-usuario">
                            <Plus size={16} /> Nuevo usuario
                        </button>
                    </div>
                    <div className="contenedor-tabla">
                        <table className="tabla tabla-movil">
                            <thead>
                                <tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th>Bloqueado hasta</th><th>Acciones</th></tr>
                            </thead>
                            <tbody>
                                {cargando ? Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j}><div className="skeleton skeleton-celda" /></td>)}</tr>
                                )) : usuarios.map(u => (
                                    <tr key={u.id}>
                                        <td data-label="Nombre" style={{ fontWeight: 500 }}>{u.nombre}</td>
                                        <td data-label="Email">{u.email}</td>
                                        <td data-label="Rol"><span className={`badge ${BADGE_ROL[u.rol] || 'badge-inactivo'}`}>{u.rol}</span></td>
                                        <td data-label="Estado"><span className={`badge ${u.activo ? 'badge-stock-ok' : 'badge-inactivo'}`}>{u.activo ? 'Activo' : 'Inactivo'}</span></td>
                                        <td data-label="Bloqueado hasta" className="cifra" style={{ fontSize: '0.75rem' }}>
                                            {u.bloqueado_hasta ? formatearFechaHora(u.bloqueado_hasta) : '—'}
                                        </td>
                                        <td data-label="Acciones">
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <button className="btn-icono" title="Editar" onClick={() => setModal({ tipo: 'editar', datos: u })} id={`btn-editar-usuario-${u.id}`}><Pencil size={14} /></button>
                                                {u.bloqueado_hasta && (
                                                    <button className="btn-icono" title="Desbloquear" onClick={() => desbloquear(u.id)} id={`btn-desbloquear-usuario-${u.id}`} style={{ color: '#166534' }}>
                                                        <Unlock size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {paginacion && (
                            <div className="paginacion">
                                <span className="paginacion-info mono">{paginacion.total} usuarios · Pág. {paginacion.page}/{paginacion.totalPages}</span>
                                <div className="paginacion-controles">
                                    <button className="btn btn-secundario btn-sm" disabled={!paginacion.hasPrevPage} onClick={paginaAnterior} id="btn-usr-pag-ant">← Anterior</button>
                                    <button className="btn btn-secundario btn-sm" disabled={!paginacion.hasNextPage} onClick={() => paginaSiguiente(paginacion)} id="btn-usr-pag-sig">Siguiente →</button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Tab Auditoría */}
            {tabActiva === 'auditoria' && (
                <div className="contenedor-tabla">
                    <table className="tabla tabla-movil">
                        <thead>
                            <tr><th>Fecha</th><th>Usuario</th><th>IP</th><th>Resultado</th><th>Motivo fallo</th></tr>
                        </thead>
                        <tbody>
                            {cargando ? Array.from({ length: 6 }).map((_, i) => (
                                <tr key={i}>{Array.from({ length: 5 }).map((_, j) => <td key={j}><div className="skeleton skeleton-celda" /></td>)}</tr>
                            )) : auditoria.map(log => (
                                <tr key={log.id}>
                                <td data-label="Fecha" className="cifra">{formatearFechaHora(log.fecha)}</td>
                                <td data-label="Usuario">{log.usuarios?.nombre || log.usuarios?.email || '—'}</td>
                                <td data-label="IP" className="cifra">{log.ip || '—'}</td>
                                <td data-label="Resultado"><span className={`badge ${log.exitoso ? 'badge-stock-ok' : 'badge-stock-bajo'}`}>{log.exitoso ? '✓ Exitoso' : '✗ Fallido'}</span></td>
                                <td data-label="Motivo fallo" style={{ color: '#B91C1C', fontSize: '0.8125rem' }}>{log.motivo_fallo || '—'}</td>
                            </tr>
                            ))}
                        </tbody>
                    </table>
                    {paginacionAuditoria && (
                        <div className="paginacion">
                            <span className="paginacion-info mono">{paginacionAuditoria.total} registros · Pág. {paginacionAuditoria.page}/{paginacionAuditoria.totalPages}</span>
                            <div className="paginacion-controles">
                                <button className="btn btn-secundario btn-sm" disabled={!paginacionAuditoria.hasPrevPage} onClick={antAudit} id="btn-aud-pag-ant">← Anterior</button>
                                <button className="btn btn-secundario btn-sm" disabled={!paginacionAuditoria.hasNextPage} onClick={() => sigAudit(paginacionAuditoria)} id="btn-aud-pag-sig">Siguiente →</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Tab Config */}
            {tabActiva === 'config' && (
                <div className="card" style={{ maxWidth: 420 }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: 20 }}>Parámetros del sistema</h3>
                    <div className="campo-formulario">
                        <label className="etiqueta" htmlFor="config-stock-min">Umbral de stock mínimo (alerta)</label>
                        <input
                            className="input"
                            id="config-stock-min"
                            type="number"
                            min="0"
                            value={stockMinimo}
                            onChange={e => setStockMinimo(e.target.value)}
                        />
                        <span style={{ fontSize: '0.75rem', color: '#6B6B6B', marginTop: 4 }}>
                            Se mostrará alerta de stock crítico cuando la cantidad sea menor a este valor.
                        </span>
                    </div>
                    <button className="btn btn-primario" onClick={guardarConfig} id="btn-guardar-config">
                        Guardar parámetros
                    </button>
                </div>
            )}

            {(modal?.tipo === 'nuevo' || modal?.tipo === 'editar') && (
                <ModalUsuario inicial={modal.datos} onGuardar={guardarUsuario} onCerrar={() => setModal(null)} cargando={cargandoModal} />
            )}
        </div>
    );
};

export default ConfiguracionPage;
