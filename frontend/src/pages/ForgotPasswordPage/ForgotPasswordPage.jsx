import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Package, ArrowLeft } from 'lucide-react';
import api from '../../services/api.js';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [cargando, setCargando] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [error, setError] = useState('');

    const manejarSubmit = async (e) => {
        e.preventDefault();
        setCargando(true);
        setError('');
        try {
            await api.post('/auth/forgot-password', { email });
            setEnviado(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al enviar el correo');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="login-fondo">
            <div className="login-card">
                {/* Logo */}
                <div className="login-logo">
                    <div className="login-logo-icono">
                        <Package size={28} color="#4A5568" />
                    </div>
                    <div>
                        <div className="login-logo-nombre">MEI</div>
                        <div className="login-logo-subtitulo">Módulo de Inventarios</div>
                    </div>
                </div>

                <div className="login-encabezado">
                    <h1 className="login-titulo">Recuperar contraseña</h1>
                    <p className="login-descripcion">
                        Ingresa tu correo y te enviaremos un enlace para restablecerla.
                    </p>
                </div>

                {enviado ? (
                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                        <Mail size={40} color="#166534" style={{ marginBottom: 12 }} />
                        <p style={{ color: '#166534', fontWeight: 600, marginBottom: 8 }}>
                            ¡Correo enviado!
                        </p>
                        <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: 24 }}>
                            Si el correo está registrado, recibirás un enlace en los próximos minutos.
                            Revisa también tu carpeta de spam.
                        </p>
                        <Link to="/login" className="btn btn-secundario" style={{ display: 'inline-flex', gap: 6 }}>
                            <ArrowLeft size={14} /> Volver al login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={manejarSubmit} className="login-form" noValidate>
                        <div className="campo-formulario">
                            <label className="etiqueta" htmlFor="fp-email">Correo electrónico</label>
                            <input
                                id="fp-email"
                                className={`input ${error ? 'error-input' : ''}`}
                                type="email"
                                value={email}
                                onChange={e => { setEmail(e.target.value); setError(''); }}
                                placeholder="correo@empresa.com"
                                autoComplete="email"
                                autoFocus
                                required
                            />
                        </div>

                        {error && (
                            <div className="login-error" role="alert">
                                <p>{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primario btn-lg login-btn-submit"
                            disabled={cargando || !email}
                            id="btn-forgot-password-submit"
                        >
                            {cargando ? 'Enviando...' : 'Enviar enlace de recuperación'}
                        </button>
                    </form>
                )}

                <div className="login-pie">
                    <Link to="/login" className="login-link-olvide">
                        <ArrowLeft size={13} style={{ verticalAlign: 'middle' }} /> Volver al login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
