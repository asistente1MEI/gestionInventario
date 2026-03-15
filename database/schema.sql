-- ============================================================
-- MEI — Módulo de Inventarios
-- Esquema completo de base de datos para Supabase/PostgreSQL
-- ============================================================

-- Habilitar extensión pgcrypto para UUIDs y funciones de hash
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TIPOS ENUMERADOS
-- ============================================================
CREATE TYPE rol_usuario AS ENUM ('ADMIN', 'OPERADOR', 'SOLO_LECTURA');
CREATE TYPE tipo_producto AS ENUM ('LAMINA', 'FONDOS');
CREATE TYPE motivo_egreso AS ENUM ('VENTA', 'AJUSTE', 'CORTE', 'DEVOLUCION');

-- ============================================================
-- TABLA: usuarios
-- ============================================================
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol rol_usuario NOT NULL DEFAULT 'OPERADOR',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    forzar_cambio_password BOOLEAN NOT NULL DEFAULT TRUE,
    intentos_fallidos INTEGER NOT NULL DEFAULT 0,
    bloqueado_hasta TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: refresh_tokens
-- ============================================================
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expira_en TIMESTAMPTZ NOT NULL,
    revocado BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: password_reset_tokens
-- ============================================================
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expira_en TIMESTAMPTZ NOT NULL,
    usado BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: auditoria_logins
-- ============================================================
CREATE TABLE auditoria_logins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    ip VARCHAR(50),
    user_agent TEXT,
    exitoso BOOLEAN NOT NULL,
    motivo_fallo VARCHAR(200),
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: proveedores
-- ============================================================
CREATE TABLE proveedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(200) NOT NULL,
    ruc_nit VARCHAR(50),
    telefono VARCHAR(30),
    email VARCHAR(200),
    direccion TEXT,
    ciudad VARCHAR(100),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: productos (catálogo maestro de láminas)
-- ============================================================
CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo tipo_producto NOT NULL DEFAULT 'LAMINA',
    color VARCHAR(100) NOT NULL,
    textura VARCHAR(100) NOT NULL,
    formato VARCHAR(100) NOT NULL,
    espesor VARCHAR(20) NOT NULL,
    medida VARCHAR(50) NOT NULL,
    unidad_medida VARCHAR(20) NOT NULL DEFAULT 'UNIDAD',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Restricción de unicidad: evita duplicados exactos
    CONSTRAINT uq_producto UNIQUE (tipo, color, textura, formato, espesor, medida)
);

-- ============================================================
-- TABLA: inventario (stock actual por producto)
-- ============================================================
CREATE TABLE inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL UNIQUE REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad_disponible DECIMAL(12, 2) NOT NULL DEFAULT 0,
    precio_compra_promedio DECIMAL(12, 4) NOT NULL DEFAULT 0,
    ultima_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: ingresos (entradas al almacén)
-- ============================================================
CREATE TABLE ingresos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    proveedor_id UUID REFERENCES proveedores(id) ON DELETE SET NULL,
    cantidad DECIMAL(12, 2) NOT NULL CHECK (cantidad > 0),
    precio_compra_unitario DECIMAL(12, 4) NOT NULL CHECK (precio_compra_unitario >= 0),
    numero_factura VARCHAR(100),
    observaciones TEXT,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: egresos (salidas del almacén)
-- ============================================================
CREATE TABLE egresos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad DECIMAL(12, 2) NOT NULL CHECK (cantidad > 0),
    motivo motivo_egreso NOT NULL DEFAULT 'VENTA',
    referencia_documento VARCHAR(150),
    observaciones TEXT,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: ajustes_inventario
-- ============================================================
CREATE TABLE ajustes_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad_anterior DECIMAL(12, 2) NOT NULL,
    cantidad_nueva DECIMAL(12, 2) NOT NULL,
    diferencia DECIMAL(12, 2) GENERATED ALWAYS AS (cantidad_nueva - cantidad_anterior) STORED,
    motivo TEXT NOT NULL,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: configuracion (parámetros del sistema)
-- ============================================================
CREATE TABLE configuracion (
    clave VARCHAR(100) PRIMARY KEY,
    valor TEXT NOT NULL,
    descripcion TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Valor inicial del umbral de stock mínimo
INSERT INTO configuracion (clave, valor, descripcion)
VALUES ('stock_minimo_alerta', '5', 'Cantidad mínima de stock antes de mostrar alerta');

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX idx_refresh_tokens_usuario ON refresh_tokens(usuario_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_auditoria_usuario ON auditoria_logins(usuario_id);
CREATE INDEX idx_auditoria_fecha ON auditoria_logins(fecha DESC);
CREATE INDEX idx_ingresos_producto ON ingresos(producto_id);
CREATE INDEX idx_ingresos_proveedor ON ingresos(proveedor_id);
CREATE INDEX idx_ingresos_fecha ON ingresos(fecha DESC);
CREATE INDEX idx_egresos_producto ON egresos(producto_id);
CREATE INDEX idx_egresos_fecha ON egresos(fecha DESC);
CREATE INDEX idx_ajustes_producto ON ajustes_inventario(producto_id);
CREATE INDEX idx_ajustes_fecha ON ajustes_inventario(fecha DESC);
CREATE INDEX idx_productos_tipo ON productos(tipo);
CREATE INDEX idx_productos_color ON productos(color);
CREATE INDEX idx_productos_activo ON productos(activo);
CREATE INDEX idx_inventario_producto ON inventario(producto_id);

-- ============================================================
-- FUNCIÓN: calcular_precio_promedio_ponderado
-- Recalcula el precio promedio ponderado al registrar un ingreso
-- ============================================================
CREATE OR REPLACE FUNCTION calcular_precio_promedio_ponderado(
    p_producto_id UUID,
    p_cantidad_nueva DECIMAL,
    p_precio_nuevo DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
    v_cantidad_actual DECIMAL;
    v_precio_actual DECIMAL;
    v_precio_promedio DECIMAL;
BEGIN
    SELECT cantidad_disponible, precio_compra_promedio
    INTO v_cantidad_actual, v_precio_actual
    FROM inventario
    WHERE producto_id = p_producto_id;

    IF NOT FOUND THEN
        RETURN p_precio_nuevo;
    END IF;

    IF (v_cantidad_actual + p_cantidad_nueva) = 0 THEN
        RETURN p_precio_nuevo;
    END IF;

    v_precio_promedio := (
        (v_cantidad_actual * v_precio_actual) + (p_cantidad_nueva * p_precio_nuevo)
    ) / (v_cantidad_actual + p_cantidad_nueva);

    RETURN ROUND(v_precio_promedio, 4);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCIÓN + TRIGGER: actualizar_inventario_en_ingreso
-- Actualiza stock y precio promedio cuando se registra un ingreso
-- ============================================================
CREATE OR REPLACE FUNCTION fn_actualizar_inventario_ingreso()
RETURNS TRIGGER AS $$
DECLARE
    v_precio_promedio DECIMAL;
BEGIN
    v_precio_promedio := calcular_precio_promedio_ponderado(
        NEW.producto_id, NEW.cantidad, NEW.precio_compra_unitario
    );

    INSERT INTO inventario (producto_id, cantidad_disponible, precio_compra_promedio, ultima_actualizacion)
    VALUES (NEW.producto_id, NEW.cantidad, v_precio_promedio, NOW())
    ON CONFLICT (producto_id) DO UPDATE SET
        cantidad_disponible = inventario.cantidad_disponible + NEW.cantidad,
        precio_compra_promedio = v_precio_promedio,
        ultima_actualizacion = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_actualizar_inventario_ingreso
    AFTER INSERT ON ingresos
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_inventario_ingreso();

-- ============================================================
-- FUNCIÓN + TRIGGER: actualizar_inventario_en_egreso
-- Descuenta stock cuando se registra un egreso
-- ============================================================
CREATE OR REPLACE FUNCTION fn_actualizar_inventario_egreso()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE inventario
    SET
        cantidad_disponible = cantidad_disponible - NEW.cantidad,
        ultima_actualizacion = NOW()
    WHERE producto_id = NEW.producto_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe registro de inventario para el producto %', NEW.producto_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_actualizar_inventario_egreso
    AFTER INSERT ON egresos
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_inventario_egreso();

-- ============================================================
-- FUNCIÓN + TRIGGER: actualizar_inventario_en_ajuste
-- Establece el stock nuevo cuando se hace un ajuste manual
-- ============================================================
CREATE OR REPLACE FUNCTION fn_actualizar_inventario_ajuste()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE inventario
    SET
        cantidad_disponible = NEW.cantidad_nueva,
        ultima_actualizacion = NOW()
    WHERE producto_id = NEW.producto_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_actualizar_inventario_ajuste
    AFTER INSERT ON ajustes_inventario
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_inventario_ajuste();

-- ============================================================
-- FUNCIÓN + TRIGGER: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION fn_actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_updated_at();

CREATE TRIGGER tg_proveedores_updated_at
    BEFORE UPDATE ON proveedores
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_updated_at();

CREATE TRIGGER tg_productos_updated_at
    BEFORE UPDATE ON productos
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_updated_at();

-- ============================================================
-- VISTA: vista_inventario_completo
-- Une productos con su stock actual para la pantalla de inventario
-- ============================================================
CREATE OR REPLACE VIEW vista_inventario_completo AS
SELECT
    p.id AS producto_id,
    p.tipo,
    p.color,
    p.textura,
    p.formato,
    p.espesor,
    p.medida,
    p.unidad_medida,
    p.activo,
    COALESCE(i.cantidad_disponible, 0) AS cantidad_disponible,
    COALESCE(i.precio_compra_promedio, 0) AS precio_compra_promedio,
    COALESCE(i.cantidad_disponible, 0) * COALESCE(i.precio_compra_promedio, 0) AS valor_total,
    i.ultima_actualizacion
FROM productos p
LEFT JOIN inventario i ON i.producto_id = p.id
WHERE p.activo = TRUE;

-- ============================================================
-- VISTA: vista_kardex_producto
-- Historial ordenado de movimientos por producto
-- ============================================================
CREATE OR REPLACE VIEW vista_kardex_producto AS
SELECT
    'INGRESO' AS tipo_movimiento,
    i.producto_id,
    i.fecha,
    i.cantidad AS cantidad_entrada,
    0 AS cantidad_salida,
    i.precio_compra_unitario AS precio_unitario,
    i.numero_factura AS referencia,
    i.observaciones,
    u.nombre AS usuario_nombre
FROM ingresos i
JOIN usuarios u ON u.id = i.usuario_id

UNION ALL

SELECT
    'EGRESO' AS tipo_movimiento,
    e.producto_id,
    e.fecha,
    0 AS cantidad_entrada,
    e.cantidad AS cantidad_salida,
    NULL AS precio_unitario,
    e.referencia_documento AS referencia,
    e.observaciones,
    u.nombre AS usuario_nombre
FROM egresos e
JOIN usuarios u ON u.id = e.usuario_id

UNION ALL

SELECT
    'AJUSTE' AS tipo_movimiento,
    a.producto_id,
    a.fecha,
    CASE WHEN a.diferencia > 0 THEN a.diferencia ELSE 0 END AS cantidad_entrada,
    CASE WHEN a.diferencia < 0 THEN ABS(a.diferencia) ELSE 0 END AS cantidad_salida,
    NULL AS precio_unitario,
    'AJUSTE' AS referencia,
    a.motivo AS observaciones,
    u.nombre AS usuario_nombre
FROM ajustes_inventario a
JOIN usuarios u ON u.id = a.usuario_id

ORDER BY fecha DESC;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria_logins ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingresos ENABLE ROW LEVEL SECURITY;
ALTER TABLE egresos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ajustes_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;

-- El backend usará service_role_key que bypasea RLS.
-- Las políticas siguientes son para acceso directo desde el cliente (seguridad adicional).

-- Política: solo el service_role puede operar (el backend Node.js usa service_role)
-- Para tablas sensibles, denegar acceso al anon key
CREATE POLICY "solo_service_role" ON usuarios USING (auth.role() = 'service_role');
CREATE POLICY "solo_service_role" ON refresh_tokens USING (auth.role() = 'service_role');
CREATE POLICY "solo_service_role" ON password_reset_tokens USING (auth.role() = 'service_role');
CREATE POLICY "solo_service_role" ON auditoria_logins USING (auth.role() = 'service_role');
CREATE POLICY "solo_service_role" ON ingresos USING (auth.role() = 'service_role');
CREATE POLICY "solo_service_role" ON egresos USING (auth.role() = 'service_role');
CREATE POLICY "solo_service_role" ON ajustes_inventario USING (auth.role() = 'service_role');
CREATE POLICY "solo_service_role" ON configuracion USING (auth.role() = 'service_role');
CREATE POLICY "solo_service_role" ON proveedores USING (auth.role() = 'service_role');
CREATE POLICY "solo_service_role" ON productos USING (auth.role() = 'service_role');
CREATE POLICY "solo_service_role" ON inventario USING (auth.role() = 'service_role');

-- ============================================================
-- USUARIO ADMIN INICIAL
-- Password: Admin1234! (bcrypt hash — cambiar en producción)
-- NOTA: Reemplaza el hash con el generado por bcrypt en tu entorno
-- ============================================================
INSERT INTO usuarios (nombre, email, password_hash, rol, forzar_cambio_password)
VALUES (
    'Administrador',
    'admin@mei.com',
    '$2b$12$placeholder_reemplazar_con_hash_bcrypt_real',
    'ADMIN',
    FALSE
);
