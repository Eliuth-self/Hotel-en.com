CREATE TABLE IF NOT EXISTS paises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(120) NOT NULL,
  codigo_iso2 CHAR(2) UNIQUE,
  codigo_iso3 CHAR(3) UNIQUE
);

CREATE TABLE IF NOT EXISTS departamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pais_id UUID NOT NULL REFERENCES paises(id),
  nombre VARCHAR(120) NOT NULL,
  codigo VARCHAR(20),
  UNIQUE (pais_id, codigo),
  UNIQUE (pais_id, nombre)
);

CREATE TABLE IF NOT EXISTS municipios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  departamento_id UUID NOT NULL REFERENCES departamentos(id),
  nombre VARCHAR(120) NOT NULL,
  codigo VARCHAR(20),
  UNIQUE (departamento_id, codigo),
  UNIQUE (departamento_id, nombre)
);

CREATE TABLE IF NOT EXISTS divisiones_territoriales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  municipio_id UUID NOT NULL REFERENCES municipios(id),
  nombre VARCHAR(120) NOT NULL,
  tipo VARCHAR(30) NOT NULL CHECK (
    tipo IN ('vereda', 'corregimiento', 'centro_poblado')
  ),
  codigo VARCHAR(20),
  estado BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (municipio_id, nombre, tipo),
  UNIQUE (id, municipio_id)
);

CREATE TABLE IF NOT EXISTS empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razon_social VARCHAR(180) NOT NULL,
  tipo_documento VARCHAR(40) NOT NULL,
  numero_documento VARCHAR(60) NOT NULL,
  correo_contacto VARCHAR(254) NOT NULL,
  telefono VARCHAR(40),
  estado VARCHAR(20) NOT NULL DEFAULT 'activa'
    CHECK (estado IN ('activa', 'inactiva')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tipo_documento, numero_documento)
);

CREATE TABLE IF NOT EXISTS establecimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL UNIQUE REFERENCES empresas(id),
  nombre_comercial VARCHAR(180) NOT NULL,
  tipo_establecimiento VARCHAR(30) NOT NULL CHECK (
    tipo_establecimiento IN ('hotel', 'residencia', 'motel')
  ),
  municipio_id UUID REFERENCES municipios(id) ON DELETE SET NULL,
  division_territorial_id UUID REFERENCES divisiones_territoriales(id) ON DELETE SET NULL,
  direccion VARCHAR(300),
  latitud NUMERIC(10, 7) CHECK (latitud BETWEEN -90 AND 90),
  longitud NUMERIC(10, 7) CHECK (longitud BETWEEN -180 AND 180),
  telefono VARCHAR(40),
  whatsapp VARCHAR(40),
  correo VARCHAR(254),
  logo_url TEXT,
  descripcion TEXT,
  estado VARCHAR(20) NOT NULL DEFAULT 'activo'
    CHECK (estado IN ('activo', 'inactivo')),
  visible_publicamente BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (division_territorial_id IS NULL OR municipio_id IS NOT NULL),
  FOREIGN KEY (division_territorial_id, municipio_id)
    REFERENCES divisiones_territoriales(id, municipio_id)
);

CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establecimiento_id UUID NOT NULL REFERENCES establecimientos(id),
  nombres VARCHAR(120) NOT NULL,
  apellidos VARCHAR(120) NOT NULL,
  correo VARCHAR(254) NOT NULL,
  password_hash TEXT NOT NULL,
  telefono VARCHAR(40),
  estado BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_acceso TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS usuarios_correo_lower_unique
  ON usuarios (LOWER(correo));
CREATE INDEX IF NOT EXISTS usuarios_establecimiento_idx
  ON usuarios (establecimiento_id);
CREATE INDEX IF NOT EXISTS establecimientos_municipio_idx
  ON establecimientos (municipio_id);
CREATE INDEX IF NOT EXISTS establecimientos_publico_idx
  ON establecimientos (visible_publicamente);

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(40) NOT NULL UNIQUE,
  nombre VARCHAR(80) NOT NULL UNIQUE,
  descripcion TEXT
);

CREATE TABLE IF NOT EXISTS usuario_roles (
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  rol_id UUID NOT NULL REFERENCES roles(id),
  PRIMARY KEY (usuario_id, rol_id)
);

CREATE TABLE IF NOT EXISTS sesiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jti UUID NOT NULL UNIQUE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS sesiones_usuario_idx ON sesiones (usuario_id);

CREATE TABLE IF NOT EXISTS auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establecimiento_id UUID REFERENCES establecimientos(id) ON DELETE SET NULL,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  accion VARCHAR(80) NOT NULL,
  entidad_afectada VARCHAR(80) NOT NULL,
  registro_id UUID,
  descripcion JSONB NOT NULL DEFAULT '{}'::JSONB,
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS auditoria_establecimiento_fecha_idx
  ON auditoria (establecimiento_id, fecha DESC);

INSERT INTO roles (codigo, nombre, descripcion)
VALUES
  ('administrador', 'Administrador', 'Control total del establecimiento.'),
  ('recepcionista', 'Recepcionista', 'Reservas, huéspedes, habitaciones, ingresos y salidas.'),
  ('cajero', 'Cajero', 'Cobros, pagos, facturación y caja.'),
  ('inventario', 'Inventario', 'Productos, minibar y movimientos de inventario.'),
  ('limpieza', 'Limpieza', 'Consulta y actualización de tareas de limpieza.'),
  ('supervisor', 'Supervisor', 'Supervisión y consulta de operaciones.')
ON CONFLICT (codigo) DO NOTHING;
