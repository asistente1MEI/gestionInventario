import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import './LoginPage.css';

const LoginPage = () => {
    const [formulario, setFormulario] = useState({ email: '', password: '' });
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');
    const [intentosRestantes, setIntentosRestantes] = useState(null);
    const { iniciarSesion } = useAuth();
    const navegar = useNavigate();

    const manejarCambio = (e) => {
        setFormulario(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    };

    const manejarSubmit = async (e) => {
        e.preventDefault();
        setCargando(true);
        setError('');

        try {
            const respuesta = await api.post('/auth/login', formulario);
            const { accessToken, usuario } = respuesta.data.data;
            iniciarSesion(accessToken, usuario);

            if (usuario.forzarCambioPassword) {
                navegar('/cambiar-password', { replace: true });
            } else {
                navegar('/dashboard', { replace: true });
            }
        } catch (err) {
            const datos = err.response?.data;
            setError(datos?.message || 'Error al iniciar sesión');
            if (datos?.intentosRestantes !== undefined) {
                setIntentosRestantes(datos.intentosRestantes);
            }
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
                    <h1 className="login-titulo">Iniciar sesión</h1>
                    <p className="login-descripcion">Ingresa con tus credenciales corporativas</p>
                </div>

                <form onSubmit={manejarSubmit} className="login-form" noValidate>
                    <div className="campo-formulario">
                        <label className="etiqueta" htmlFor="login-email">Correo electrónico</label>
                        <input
                            id="login-email"
                            className={`input ${error ? 'error-input' : ''}`}
                            type="email"
                            name="email"
                            value={formulario.email}
                            onChange={manejarCambio}
                            placeholder="correo@empresa.com"
                            autoComplete="email"
                            autoFocus
                            required
                        />
                    </div>

                    <div className="campo-formulario">
                        <label className="etiqueta" htmlFor="login-password">Contraseña</label>
                        <div className="input-wrapper">
                            <input
                                id="login-password"
                                className={`input ${error ? 'error-input' : ''}`}
                                type={mostrarPassword ? 'text' : 'password'}
                                name="password"
                                value={formulario.password}
                                onChange={manejarCambio}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                required
                            />
                            <button
                                type="button"
                                className="btn-icono-input"
                                onClick={() => setMostrarPassword(v => !v)}
                                tabIndex={-1}
                                aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            >
                                {mostrarPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Error inline */}
                    {error && (
                        <div className="login-error" role="alert">
                            <p>{error}</p>
                            {intentosRestantes !== null && intentosRestantes <= 2 && (
                                <p className="login-error-intentos">
                                    {intentosRestantes === 0
                                        ? 'Cuenta bloqueada por múltiples intentos fallidos.'
                                        : `Te queda${intentosRestantes === 1 ? '' : 'n'} ${intentosRestantes} intento${intentosRestantes === 1 ? '' : 's'} antes del bloqueo.`
                                    }
                                </p>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primario btn-lg login-btn-submit"
                        disabled={cargando || !formulario.email || !formulario.password}
                        id="btn-login-submit"
                    >
                        {cargando ? 'Verificando...' : 'Ingresar'}
                    </button>
                </form>

                <div className="login-pie">
                    <Link to="/forgot-password" className="login-link-olvide">
                        ¿Olvidaste tu contraseña?
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
