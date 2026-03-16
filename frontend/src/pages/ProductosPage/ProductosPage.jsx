import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, X, Download, Upload, RefreshCcw } from 'lucide-react';
import * as XLSX from 'xlsx';   // solo para leer archivos en procesarArchivo
import api from '../../services/api.js';
import { useToast } from '../../components/Toast/Toast.jsx';
import { usePaginacion } from '../../hooks/usePaginacion.js';
import { confirmarEliminar, confirmarReactivar, alerta } from '../../utils/alerta.js';
import { exportarExcel } from '../../utils/exportarExcel.js';
import './ProductosPage.css';

const TIPOS = ['LAMINA', 'FONDO'];

const OPCIONES_BASE = {
    textura: ['MADERA', 'SOFT', 'RUSTIK', 'FOREST', 'UNICO'],
    formato: ['RH', 'ESTANDAR', 'RH UNICOR'],
    medida: ['1830X2440', '2150X2440', '1530X2440'],
};

const STORAGE_KEY = 'mei_opciones_producto';

const leerOpcionesGuardadas = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return OPCIONES_BASE;
        const custom = JSON.parse(raw);
        return {
            textura: [...new Set([...OPCIONES_BASE.textura, ...(custom.textura || [])])],
            formato: [...new Set([...OPCIONES_BASE.formato, ...(custom.formato || [])])],
            medida: [...new Set([...OPCIONES_BASE.medida, ...(custom.medida || [])])],
        };
    } catch { return OPCIONES_BASE; }
};

const guardarNuevaOpcion = (campo, valor) => {
    try {
        const guardado = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        const lista = guardado[campo] || [];
        if (!lista.includes(valor)) {
            guardado[campo] = [...lista, valor];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(guardado));
        }
    } catch { /* ignorar si localStorage no disponible */ }
};

// ─── Definido FUERA del form para evitar remontaje en cada render ───────────
const CampoConOtro = ({ nombre, etiqueta, valor, opciones, onCambio }) => {
    const esOtro = !!valor && !opciones.includes(valor);
    const [mostrarInput, setMostrarInput] = React.useState(esOtro);

    const manejarSelect = (e) => {
        if (e.target.value === '__otro__') {
            setMostrarInput(true);
            onCambio({ target: { name: nombre, value: '' } });
        } else {
            setMostrarInput(false);
            onCambio(e);
        }
    };

    return (
        <div className="campo-formulario">
            <label className="etiqueta" htmlFor={`prod-sel-${nombre}`}>{etiqueta}</label>
            {!mostrarInput ? (
                <select
                    className="select-campo"
                    id={`prod-sel-${nombre}`}
                    name={nombre}
                    value={valor || ''}
                    onChange={manejarSelect}
                >
                    <option value="">Seleccionar...</option>
                    {opciones.map(o => <option key={o} value={o}>{o}</option>)}
                    <option value="__otro__">Otro...</option>
                </select>
            ) : (
                <div className="input-wrapper">
                    <input
                        className="input"
                        id={`prod-sel-${nombre}`}
                        name={nombre}
                        value={valor}
                        onChange={onCambio}
                        placeholder={`Escribe la ${etiqueta.toLowerCase()}...`}
                        autoFocus
                    />
                    <button
                        type="button"
                        className="btn-icono-input"
                        title="Volver al selector"
                        onClick={() => { setMostrarInput(false); onCambio({ target: { name: nombre, value: '' } }); }}
                        tabIndex={-1}
                    >
                        <X size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};

const FormProducto = ({ inicial = {}, onGuardar, onCerrar, cargando, opciones }) => {
    const [form, setForm] = useState({
        tipo: 'LAMINA', color: '', textura: '', formato: '',
        espesor: '', medida: '', unidad_medida: 'UNIDAD', ...inicial
    });
    const manejarCambio = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    return (
        <div className="overlay-modal" onClick={onCerrar}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-encabezado">
                    <h2 className="modal-titulo">{inicial.id ? 'Editar producto' : 'Nuevo producto'}</h2>
                    <button className="btn-icono" onClick={onCerrar} id="btn-cerrar-form-producto"><X size={18} /></button>
                </div>
                <div className="modal-cuerpo">
                    {/* Tipo */}
                    <div className="campo-formulario">
                        <label className="etiqueta">Tipo</label>
                        <select className="select-campo" name="tipo" value={form.tipo} onChange={manejarCambio}>
                            {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    {/* Color (texto libre) */}
                    <div className="campo-formulario">
                        <label className="etiqueta" htmlFor="prod-color">Color</label>
                        <input className="input" id="prod-color" name="color" value={form.color} onChange={manejarCambio} placeholder="Ej: HUMO, CAPUCCINO" />
                    </div>
                    {/* Textura, Formato, Medida con selector + Otro */}
                    <CampoConOtro nombre="textura" etiqueta="Textura" valor={form.textura} opciones={opciones.textura} onCambio={manejarCambio} />
                    <CampoConOtro nombre="formato" etiqueta="Formato" valor={form.formato} opciones={opciones.formato} onCambio={manejarCambio} />
                    {/* Espesor (texto libre) */}
                    <div className="campo-formulario">
                        <label className="etiqueta" htmlFor="prod-espesor">Espesor</label>
                        <input className="input" id="prod-espesor" name="espesor" value={form.espesor} onChange={manejarCambio} placeholder="Ej: 4MM, 5.5MM, 9MM" />
                    </div>
                    <CampoConOtro nombre="medida" etiqueta="Medida" valor={form.medida} opciones={opciones.medida} onCambio={manejarCambio} />
                    {/* Unidad de medida */}
                    <div className="campo-formulario">
                        <label className="etiqueta" htmlFor="prod-unidad">Unidad de medida</label>
                        <input className="input" id="prod-unidad" name="unidad_medida" value={form.unidad_medida} onChange={manejarCambio} placeholder="UNIDAD" />
                    </div>
                </div>
                <div className="modal-pie">
                    <button className="btn btn-secundario" onClick={onCerrar} id="btn-cancelar-producto">Cancelar</button>
                    <button className="btn btn-primario" disabled={cargando} onClick={() => onGuardar(form)} id="btn-guardar-producto">
                        {cargando ? 'Guardando...' : (inicial.id ? 'Actualizar' : 'Crear producto')}
                    </button>
                </div>
            </div>
        </div>
    );
};


const ProductosPage = () => {
    const [productos, setProductos] = useState([]);
    const [paginacion, setPaginacion] = useState(null);
    const [modal, setModal] = useState(null);
    const [cargandoModal, setCargandoModal] = useState(false);
    const [cargando, setCargando] = useState(true);
    const [subiendoArchivo, setSubiendoArchivo] = useState(false);
    const [opciones, setOpciones] = useState(leerOpcionesGuardadas);
    const inputArchivoRef = useRef(null);
    const { exito, error: errorToast } = useToast();
    const { pagina, limite, paginaSiguiente, paginaAnterior } = usePaginacion(20);

    const cargarProductos = useCallback(async () => {
        setCargando(true);
        try {
            const r = await api.get('/productos', { params: { page: pagina, limit: limite } });
            setProductos(r.data.data || []);
            setPaginacion(r.data.pagination);
        } catch { errorToast('Error al cargar productos'); }
        finally { setCargando(false); }
    }, [pagina, limite]);

    useEffect(() => { cargarProductos(); }, [cargarProductos]);

    const guardarProducto = async (datos) => {
        setCargandoModal(true);
        try {
            if (modal?.datos?.id) {
                await api.put(`/productos/${modal.datos.id}`, datos);
                exito('Producto actualizado');
            } else {
                await api.post('/productos', datos);
                exito('Producto creado');
            }
            // Si el valor no es de la lista base, guardarlo en localStorage
            ['textura', 'formato', 'medida'].forEach(campo => {
                const val = String(datos[campo] || '').trim();
                if (val && !OPCIONES_BASE[campo].includes(val)) {
                    guardarNuevaOpcion(campo, val);
                }
            });
            setOpciones(leerOpcionesGuardadas());
            setModal(null);
            cargarProductos();
        } catch (err) {
            const status = err.response?.status;
            const mensaje = err.response?.data?.message || '';

            if (status === 409) {
                // Producto duplicado — explicar qué combinación ya existe
                const { tipo, color, textura, formato, espesor, medida } = datos;
                await alerta.fire({
                    icon: 'warning',
                    title: 'Producto ya existe',
                    html: `<p style="font-size:0.9rem">Ya existe un producto con esa combinación de características:</p>
                           <p class="mono" style="font-size:0.82rem;background:#F8F8F7;border-radius:6px;padding:8px;margin-top:8px">
                             <b>${tipo}</b> — ${color} / ${textura} / ${formato} / ${espesor} / ${medida}
                           </p>
                           <p style="font-size:0.82rem;color:#4A5568;margin-top:8px">
                             Verifica e intenta nuevamente
                           </p>`,
                    confirmButtonText: 'Entendido',
                });
            } else if (status === 400) {
                // Error de validación — listar campos inválidos si los hay
                const detalles = err.response?.data?.errors;
                if (detalles?.length) {
                    const lista = detalles.map(e => `• ${e.msg}`).join('<br/>');
                    await alerta.fire({
                        icon: 'error',
                        title: 'Datos incompletos',
                        html: `<div style="text-align:left;font-size:0.875rem">${lista}</div>`,
                        confirmButtonText: 'Corregir',
                    });
                } else {
                    errorToast(mensaje || 'Datos inválidos — revisa los campos obligatorios');
                }
            } else {
                errorToast(mensaje || 'Error del servidor al guardar. Intenta de nuevo.');
            }
        } finally { setCargandoModal(false); }
    };

    const pedirEliminarProducto = async (producto) => {
        const confirmado = await confirmarEliminar(`${producto.color} / ${producto.textura}`);
        if (!confirmado) return;
        try {
            await api.delete(`/productos/${producto.id}`);
            exito('Producto desactivado');
            cargarProductos();
        } catch { errorToast('Error al desactivar'); }
    };

    const pedirReactivarProducto = async (producto) => {
        const confirmado = await confirmarReactivar(`${producto.color} / ${producto.textura}`);
        if (!confirmado) return;
        try {
            await api.patch(`/productos/${producto.id}/activar`);
            exito('Producto reactivado exitosamente');
            cargarProductos();
        } catch { errorToast('Error al reactivar producto'); }
    };

    // ── Plantilla XLSX ─────────────────────────────────────────────────────
    const descargarPlantilla = async () => {
        await exportarExcel({
            nombreArchivo: 'plantilla_carga_masiva_MEI',
            nombreHoja: 'Productos',
            titulo: 'MEI — Plantilla de Carga Masiva de Productos',
            subtitulo: 'Completa las filas a partir de la fila 5. Respeta los encabezados. Los campos marcados como OBLIGATORIO son requeridos.',
            cabeceras: ['tipo', 'color', 'textura', 'formato', 'espesor', 'medida', 'unidad_medida', 'cantidad_inicial', 'precio_compra'],
            anchos: [20, 16, 16, 16, 12, 18, 20, 18, 16],
            filas: [
                ['LAMINA', 'HUMO', 'MADERA', 'RH', '4MM', '1830X2440', 'UNIDAD', 50, 120000],
                ['FONDO', 'BLANCO', 'SOFT', 'ESTANDAR', '3MM', '2150X2440', 'UNIDAD', 12, 45000],
                ['LAMINA', 'MACADAMIA', 'RUSTIK', 'RH', '15MM', '1830X2440', 'UNIDAD', 0, 150000],
                ['', '', '', '', '', '', '', '', ''],
            ]
        });
        exito('Plantilla descargada');
    };

    // ── Mapa de columnas: acepta variaciones de nombres ───────────────────
    const MAPA_COLUMNAS = {
        tipo: ['tipo', 'type'],
        color: ['color', 'colour'],
        textura: ['textura', 'texture', 'acabado'],
        formato: ['formato', 'format', 'formato_hoja'],
        espesor: ['espesor', 'thickness', 'grosor', 'espesor_mm'],
        medida: ['medida', 'measure', 'dimension', 'dimensiones', 'tamaño'],
        unidad_medida: ['unidad_medida', 'unidad', 'unit', 'um'],
        cantidad_inicial: ['cantidad_inicial', 'cantidad', 'stock', 'stock_inicial', 'quantity'],
        precio: ['precio', 'precio_compra', 'costo', 'price', 'valor'],
    };

    const normalizarFila = (fila) => {
        const resultado = {};
        const clavesRaw = Object.keys(fila);
        for (const [campoEsperado, variantes] of Object.entries(MAPA_COLUMNAS)) {
            const claveEncontrada = clavesRaw.find(k =>
                variantes.some(v => k.trim().toLowerCase() === v.toLowerCase())
            );
            if (claveEncontrada !== undefined) {
                resultado[campoEsperado] = fila[claveEncontrada];
            }
        }
        return resultado;
    };

    // ── Subir XLSX ─────────────────────────────────────────────────────────
    const procesarArchivo = async (e) => {
        const archivo = e.target.files?.[0];
        if (!archivo) return;
        e.target.value = '';

        setSubiendoArchivo(true);
        try {
            const buffer = await archivo.arrayBuffer();
            const libro = XLSX.read(buffer, { type: 'array' });
            const hojaName = libro.SheetNames[0];
            const hoja = libro.Sheets[hojaName];
            
            // Leer como array de arrays para buscar la cabecera real
            const filasRaw = XLSX.utils.sheet_to_json(hoja, { header: 1, defval: '' });
            
            // Buscar la fila de cabeceras (aquella que tenga 'tipo' y 'color')
            let indiceCabecera = -1;
            let cabecerasEncontradas = [];
            for (let i = 0; i < filasRaw.length; i++) {
                const filaStr = filasRaw[i].map(c => String(c).trim().toLowerCase());
                if (filaStr.includes('tipo') && filaStr.includes('color')) {
                    indiceCabecera = i;
                    cabecerasEncontradas = filaStr;
                    break;
                }
            }

            if (indiceCabecera === -1) {
                errorToast('No se encontró la fila de encabezados en el Excel. Debe incluir "tipo" y "color".');
                setSubiendoArchivo(false);
                return;
            }

            // Convertir las filas siguientes en objetos usando esa cabecera
            const todasFilas = [];
            for (let i = indiceCabecera + 1; i < filasRaw.length; i++) {
                const filaObj = {};
                for (let j = 0; j < cabecerasEncontradas.length; j++) {
                    const key = cabecerasEncontradas[j];
                    if (key) filaObj[key] = filasRaw[i][j];
                }
                todasFilas.push(filaObj);
            }

            // Normalizar nombres de columnas y filtrar filas de instrucciones/vacías
            const filas = todasFilas
                .map(normalizarFila)
                .filter(f => {
                    const tipo = String(f.tipo || '');
                    return tipo && !tipo.startsWith('—') && !tipo.startsWith('---');
                });

            if (!filas.length) {
                errorToast('No se encontraron filas con datos. Verifica que los encabezados del archivo sean: tipo, color, textura, formato, espesor, medida.');
                setSubiendoArchivo(false);
                return;
            }

            const r = await api.post('/productos/importar', filas);
            const { creados, omitidos, errores, total } = r.data.data;

            let html = `<p><b>${total}</b> filas procesadas</p>
                <p style="color:#166534"><b>${creados}</b> productos creados</p>
                <p style="color:#92400E"><b>${omitidos}</b> duplicados omitidos</p>`;
            if (errores.length) {
                html += `<p style="color:#B91C1C"><b>${errores.length}</b> errores:</p>
                    <ul style="text-align:left;font-size:0.82rem;max-height:140px;overflow-y:auto">
                    ${errores.slice(0, 10).map(e => `<li>Fila ${e.fila}: ${e.motivo}</li>`).join('')}</ul>`;
            }

            await alerta.fire({ title: 'Resultado de la carga', html, icon: creados > 0 ? 'success' : 'warning', confirmButtonText: 'Entendido' });
            if (creados > 0) cargarProductos();
        } catch (err) {
            errorToast(err.response?.data?.message || 'Error al procesar el archivo');
        } finally { setSubiendoArchivo(false); }
    };

    return (
        <div>
            <div className="encabezado-pagina">
                <div>
                    <h1 className="titulo-pagina">Productos</h1>
                    <p className="subtitulo-pagina">Catálogo maestro de láminas</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secundario" onClick={descargarPlantilla} id="btn-descargar-plantilla" title="Descarga la plantilla XLSX para carga masiva">
                        <Download size={15} /> Plantilla
                    </button>
                    <button className="btn btn-secundario" onClick={() => inputArchivoRef.current?.click()}
                        disabled={subiendoArchivo} id="btn-carga-masiva">
                        <Upload size={15} /> {subiendoArchivo ? 'Cargando...' : 'Carga masiva'}
                    </button>
                    <input ref={inputArchivoRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={procesarArchivo} />
                    <button className="btn btn-primario" onClick={() => setModal({ tipo: 'nuevo', datos: {} })} id="btn-nuevo-producto">
                        <Plus size={16} /> Nuevo producto
                    </button>
                </div>
            </div>
            <div className="contenedor-tabla">
                <table className="tabla tabla-movil">
                    <thead>
                        <tr>
                            <th>Tipo</th><th>Color</th><th>Textura</th><th>Formato</th>
                            <th>Espesor</th><th>Medida</th><th>U.M.</th><th>Estado</th><th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cargando ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>{Array.from({ length: 9 }).map((_, j) => <td key={j}><div className="skeleton skeleton-celda" /></td>)}</tr>
                            ))
                        ) : productos.length === 0 ? (
                            <tr><td colSpan={9}><div className="estado-vacio"><p>No hay productos. Crea el primero.</p></div></td></tr>
                        ) : productos.map(p => (
                            <tr key={p.id}>
                                <td data-label="Tipo"><span className="badge badge-activo">{p.tipo}</span></td>
                                <td data-label="Color">{p.color}</td>
                                <td data-label="Textura">{p.textura}</td>
                                <td data-label="Formato">{p.formato}</td>
                                <td data-label="Espesor" className="cifra">{p.espesor}</td>
                                <td data-label="Medida" className="cifra">{p.medida}</td>
                                <td data-label="U.M.">{p.unidad_medida}</td>
                                <td data-label="Estado">
                                    <span className={`badge ${p.activo ? 'badge-stock-ok' : 'badge-inactivo'}`}>
                                        {p.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td data-label="Acciones">
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <button className="btn-icono" title="Editar" onClick={() => setModal({ tipo: 'editar', datos: p })} id={`btn-editar-producto-${p.id}`}>
                                            <Pencil size={14} />
                                        </button>
                                        {p.activo ? (
                                            <button className="btn-icono" title="Desactivar" onClick={() => pedirEliminarProducto(p)} id={`btn-eliminar-producto-${p.id}`}
                                                style={{ color: '#B91C1C' }}>
                                                <Trash2 size={14} />
                                            </button>
                                        ) : (
                                            <button className="btn-icono" title="Activar" onClick={() => pedirReactivarProducto(p)} id={`btn-reactivar-producto-${p.id}`}
                                                style={{ color: '#166534' }}>
                                                <RefreshCcw size={14} />
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
                        <span className="paginacion-info mono">{paginacion.total} productos · Pág. {paginacion.page}/{paginacion.totalPages}</span>
                        <div className="paginacion-controles">
                            <button className="btn btn-secundario btn-sm" disabled={!paginacion.hasPrevPage} onClick={paginaAnterior} id="btn-prod-pag-ant">← Anterior</button>
                            <button className="btn btn-secundario btn-sm" disabled={!paginacion.hasNextPage} onClick={() => paginaSiguiente(paginacion)} id="btn-prod-pag-sig">Siguiente →</button>
                        </div>
                    </div>
                )}
            </div>

            {(modal?.tipo === 'nuevo' || modal?.tipo === 'editar') && (
                <FormProducto
                    inicial={modal.datos}
                    onGuardar={guardarProducto}
                    onCerrar={() => setModal(null)}
                    cargando={cargandoModal}
                    opciones={opciones}
                />
            )}


        </div>
    );
};

export default ProductosPage;
