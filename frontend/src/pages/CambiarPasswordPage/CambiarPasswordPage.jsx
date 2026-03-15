import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../components/Toast/Toast.jsx';
import api from '../../services/api.js';
import './CambiarPasswordPage.css';

const calcularFortaleza = (password) => {
    let puntuacion = 0;
    if (password.length >= 8) puntuacion++;
    if (password.length >= 12) puntuacion++;
    if (/[A-Z]/.test(password)) puntuacion++;
    if (/[0-9]/.test(password)) puntuacion++;
    if (/[^A-Za-z0-9]/.test(password)) puntuacion++;
    const niveles = ['', 'Débil', 'Regular', 'Buena', 'Fuerte', 'Muy fuerte'];
    const clases = ['', 'fortaleza-debil', 'fortaleza-regular', 'fortaleza-buena', 'fortaleza-fuerte', 'fortaleza-muy-fuerte'];
    return { puntuacion, etiqueta: niveles[puntuacion] || '', clase: clases[puntuacion] || '' };
};

// ─── Definido FUERA del componente principal para evitar remontaje en cada render ───
const CampoPassword = ({ nombre, etiqueta, valor, visible, onCambio, onToggleVer }) => (
    <div className="campo-formulario">
        <label className="etiqueta" htmlFor={`cp-${nombre}`}>{etiqueta}</label>
        <div className="input-wrapper">
            <input
                id={`cp-${nombre}`}
                className="input"
                type={visible ? 'text' : 'password'}
                name={nombre}
                value={valor}
                onChange={onCambio}
                placeholder="••••••••"
                autoComplete="new-password"
                required
            />
            <button type="button" className="btn-icono-input" onClick={onToggleVer} tabIndex={-1}>
                {visible ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
        </div>
    </div>
);

const CambiarPasswordPage = () => {
    const [formulario, setFormulario] = useState({ password_actual: '', nueva_password: '', confirmar_password: '' });
    const [mostrar, setMostrar] = useState({ actual: false, nueva: false, confirmar: false });
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');
    const { actualizarUsuario } = useAuth();
    const { exito } = useToast();
    const navegar = useNavigate();

    const fortaleza = calcularFortaleza(formulario.nueva_password);

    const manejarCambio = (e) => {
        setFormulario(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    };

    const toggleMostrar = (campo) => setMostrar(prev => ({ ...prev, [campo]: !prev[campo] }));

    const manejarSubmit = async (e) => {
        e.preventDefault();
        if (formulario.nueva_password !== formulario.confirmar_password) {
            setError('Las contraseñas no coinciden');
            return;
        }
        if (fortaleza.puntuacion < 3) {
            setError('La contraseña es demasiado débil');
            return;
        }
        setCargando(true);
        try {
            await api.post('/auth/change-password', {
                password_actual: formulario.password_actual,
                nueva_password: formulario.nueva_password
            });
            actualizarUsuario({ forzarCambioPassword: false });
            exito('Contraseña actualizada correctamente');
            navegar('/dashboard', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Error al cambiar contraseña');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="cambiar-pwd-fondo">
            <div className="cambiar-pwd-card">
                <div className="cambiar-pwd-icono">
                    <ShieldCheck size={32} color="#4A5568" />
                </div>
                <h1 className="cambiar-pwd-titulo">Establece tu contraseña personal</h1>
                <p className="cambiar-pwd-descripcion">
                    Por seguridad, debes cambiar la contraseña temporal asignada por el administrador antes de continuar.
                </p>

                <form onSubmit={manejarSubmit} noValidate>
                    <CampoPassword
                        nombre="password_actual"
                        etiqueta="Contraseña actual (temporal)"
                        valor={formulario.password_actual}
                        visible={mostrar.actual}
                        onCambio={manejarCambio}
                        onToggleVer={() => toggleMostrar('actual')}
                    />
                    <CampoPassword
                        nombre="nueva_password"
                        etiqueta="Nueva contraseña"
                        valor={formulario.nueva_password}
                        visible={mostrar.nueva}
                        onCambio={manejarCambio}
                        onToggleVer={() => toggleMostrar('nueva')}
                    />

                    {formulario.nueva_password && (
                        <div className="fortaleza-indicador">
                            <div className="fortaleza-barras">
                                {[1, 2, 3, 4, 5].map(n => (
                                    <div key={n} className={`fortaleza-barra ${n <= fortaleza.puntuacion ? fortaleza.clase : ''}`} />
                                ))}
                            </div>
                            <span className={`fortaleza-etiqueta ${fortaleza.clase}`}>{fortaleza.etiqueta}</span>
                        </div>
                    )}

                    <div className="cambiar-pwd-requisitos">
                        <span className={formulario.nueva_password.length >= 8 ? 'req-ok' : 'req-pendiente'}>✓ Mínimo 8 caracteres</span>
                        <span className={/[A-Z]/.test(formulario.nueva_password) ? 'req-ok' : 'req-pendiente'}>✓ Una mayúscula</span>
                        <span className={/[0-9]/.test(formulario.nueva_password) ? 'req-ok' : 'req-pendiente'}>✓ Un número</span>
                    </div>

                    <CampoPassword
                        nombre="confirmar_password"
                        etiqueta="Confirmar nueva contraseña"
                        valor={formulario.confirmar_password}
                        visible={mostrar.confirmar}
                        onCambio={manejarCambio}
                        onToggleVer={() => toggleMostrar('confirmar')}
                    />

                    {error && <div className="login-error" role="alert"><p>{error}</p></div>}

                    <button
                        type="submit"
                        className="btn btn-primario btn-lg cambiar-pwd-btn"
                        disabled={cargando || !formulario.password_actual || !formulario.nueva_password || !formulario.confirmar_password}
                        id="btn-cambiar-password-submit"
                    >
                        {cargando ? 'Guardando...' : 'Establecer contraseña'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CambiarPasswordPage;
