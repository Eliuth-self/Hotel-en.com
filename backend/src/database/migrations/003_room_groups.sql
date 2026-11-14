CREATE TABLE IF NOT EXISTS grupos_habitaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establecimiento_id UUID NOT NULL
    REFERENCES establecimientos(id) ON DELETE CASCADE,
  nombre VARCHAR(180) NOT NULL,
  ubicacion VARCHAR(180) NOT NULL,
  minibar BOOLEAN NOT NULL DEFAULT FALSE,
  resena TEXT,
  contenido JSONB NOT NULL DEFAULT '[]'::JSONB
    CHECK (jsonb_typeof(contenido) = 'array'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS grupos_habitaciones_nombre_unique
  ON grupos_habitaciones (establecimiento_id, LOWER(nombre));

CREATE TABLE IF NOT EXISTS tarifas_grupos_habitaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id UUID NOT NULL
    REFERENCES grupos_habitaciones(id) ON DELETE CASCADE,
  modalidad VARCHAR(100) NOT NULL,
  duracion_minutos INTEGER CHECK (duracion_minutos IS NULL OR duracion_minutos > 0),
  precio NUMERIC(12, 2) NOT NULL CHECK (precio > 0),
  moneda CHAR(3) NOT NULL DEFAULT 'COP'
    CHECK (moneda ~ '^[A-Z]{3}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS tarifas_grupo_modalidad_duracion_unique
  ON tarifas_grupos_habitaciones (
    grupo_id,
    LOWER(modalidad),
    COALESCE(duracion_minutos, 0)
  );
