import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import api from '../../services/api.js';

const calcularFortaleza = (password) => {
    let puntuacion = 0;
    if (password.length >= 8) puntuacion++;
    if (password.length >= 12) puntuacion++;
    if (/[A-Z]/.test(password)) puntuacion++;
    if (/[0-9]/.test(password)) puntuacion++;
    if (/[^A-Za-z0-9]/.test(password)) puntuacion++;
    const niveles = ['', 'Débil', 'Regular', 'Buena', 'Fuerte', 'Muy fuerte'];
    const clases  = ['', 'fortaleza-debil', 'fortaleza-regular', 'fortaleza-buena', 'fortaleza-fuerte', 'fortaleza-muy-fuerte'];
    return { puntuacion, etiqueta: niveles[puntuacion] || '', clase: clases[puntuacion] || '' };
};

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';
    const navegar = useNavigate();

    const [form, setForm] = useState({ nueva_password: '', confirmar_password: '' });
    const [mostrar, setMostrar] = useState({ nueva: false, confirmar: false });
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');
    const [exito, setExito] = useState(false);

    const fortaleza = calcularFortaleza(form.nueva_password);

    const manejarCambio = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    };

    const manejarSubmit = async (e) => {
        e.preventDefault();
        if (form.nueva_password !== form.confirmar_password) {
            setError('Las contraseñas no coinciden');
            return;
        }
        if (fortaleza.puntuacion < 3) {
            setError('La contraseña es demasiado débil');
            return;
        }
        if (!token) {
            setError('Token inválido o expirado. Solicita un nuevo enlace.');
            return;
        }
        setCargando(true);
        try {
            await api.post('/auth/reset-password', { token, nueva_password: form.nueva_password });
            setExito(true);
            setTimeout(() => navegar('/login', { replace: true }), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al restablecer la contraseña. El enlace puede haber expirado.');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="login-fondo">
            <div className="login-card">
                <div className="cambiar-pwd-icono">
                    <ShieldCheck size={32} color="#4A5568" />
                </div>
                <h1 className="login-titulo" style={{ textAlign: 'center', marginBottom: 4 }}>
                    Restablecer contraseña
                </h1>
                <p className="login-descripcion" style={{ textAlign: 'center', marginBottom: 24 }}>
                    Crea una nueva contraseña segura para tu cuenta.
                </p>

                {exito ? (
                    <div style={{ textAlign: 'center', padding: '8px 0' }}>
                        <p style={{ color: '#166534', fontWeight: 600, marginBottom: 8 }}>
                            ✓ Contraseña restablecida correctamente
                        </p>
                        <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
                            Serás redirigido al login en unos segundos...
                        </p>
                    </div>
                ) : !token ? (
                    <div className="login-error" role="alert">
                        <p>El enlace es inválido o ha expirado.</p>
                        <Link to="/forgot-password" className="login-link-olvide" style={{ display: 'inline-block', marginTop: 8 }}>
                            Solicitar nuevo enlace
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={manejarSubmit} className="login-form" noValidate>
                        {/* Nueva contraseña */}
                        <div className="campo-formulario">
                            <label className="etiqueta" htmlFor="rp-nueva">Nueva contraseña</label>
                            <div className="input-wrapper">
                                <input
                                    id="rp-nueva"
                                    className="input"
                                    type={mostrar.nueva ? 'text' : 'password'}
                                    name="nueva_password"
                                    value={form.nueva_password}
                                    onChange={manejarCambio}
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    autoFocus
                                    required
                                />
                                <button type="button" className="btn-icono-input" onClick={() => setMostrar(p => ({ ...p, nueva: !p.nueva }))} tabIndex={-1}>
                                    {mostrar.nueva ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Indicador de fortaleza */}
                        {form.nueva_password && (
                            <div className="fortaleza-indicador">
                                <div className="fortaleza-barras">
                                    {[1,2,3,4,5].map(n => (
                                        <div key={n} className={`fortaleza-barra ${n <= fortaleza.puntuacion ? fortaleza.clase : ''}`} />
                                    ))}
                                </div>
                                <span className={`fortaleza-etiqueta ${fortaleza.clase}`}>{fortaleza.etiqueta}</span>
                            </div>
                        )}

                        <div className="cambiar-pwd-requisitos">
                            <span className={form.nueva_password.length >= 8 ? 'req-ok' : 'req-pendiente'}>✓ Mínimo 8 caracteres</span>
                            <span className={/[A-Z]/.test(form.nueva_password) ? 'req-ok' : 'req-pendiente'}>✓ Una mayúscula</span>
                            <span className={/[0-9]/.test(form.nueva_password) ? 'req-ok' : 'req-pendiente'}>✓ Un número</span>
                        </div>

                        {/* Confirmar contraseña */}
                        <div className="campo-formulario">
                            <label className="etiqueta" htmlFor="rp-confirmar">Confirmar nueva contraseña</label>
                            <div className="input-wrapper">
                                <input
                                    id="rp-confirmar"
                                    className="input"
                                    type={mostrar.confirmar ? 'text' : 'password'}
                                    name="confirmar_password"
                                    value={form.confirmar_password}
                                    onChange={manejarCambio}
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    required
                                />
                                <button type="button" className="btn-icono-input" onClick={() => setMostrar(p => ({ ...p, confirmar: !p.confirmar }))} tabIndex={-1}>
                                    {mostrar.confirmar ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="login-error" role="alert"><p>{error}</p></div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primario btn-lg login-btn-submit"
                            disabled={cargando || !form.nueva_password || !form.confirmar_password}
                            id="btn-reset-password-submit"
                        >
                            {cargando ? 'Guardando...' : 'Restablecer contraseña'}
                        </button>
                    </form>
                )}

                <div className="login-pie">
                    <Link to="/login" className="login-link-olvide">← Volver al login</Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
