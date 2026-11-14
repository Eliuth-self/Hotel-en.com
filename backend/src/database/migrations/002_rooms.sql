CREATE TABLE IF NOT EXISTS habitaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establecimiento_id UUID NOT NULL
    REFERENCES establecimientos(id) ON DELETE CASCADE,
  numero VARCHAR(40) NOT NULL,
  ubicacion VARCHAR(180) NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'disponible'
    CHECK (estado IN ('disponible', 'ocupada', 'mantenimiento', 'limpieza', 'inactiva')),
  minibar BOOLEAN NOT NULL DEFAULT FALSE,
  resena TEXT,
  contenido JSONB NOT NULL DEFAULT '[]'::JSONB
    CHECK (jsonb_typeof(contenido) = 'array'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (establecimiento_id, numero)
);

CREATE INDEX IF NOT EXISTS habitaciones_establecimiento_estado_idx
  ON habitaciones (establecimiento_id, estado);

CREATE TABLE IF NOT EXISTS tarifas_habitaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habitacion_id UUID NOT NULL
    REFERENCES habitaciones(id) ON DELETE CASCADE,
  modalidad VARCHAR(100) NOT NULL,
  duracion_minutos INTEGER CHECK (duracion_minutos IS NULL OR duracion_minutos > 0),
  precio NUMERIC(12, 2) NOT NULL CHECK (precio > 0),
  moneda CHAR(3) NOT NULL DEFAULT 'COP'
    CHECK (moneda ~ '^[A-Z]{3}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS tarifas_habitacion_modalidad_duracion_unique
  ON tarifas_habitaciones (
    habitacion_id,
    LOWER(modalidad),
    COALESCE(duracion_minutos, 0)
  );
