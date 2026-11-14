CREATE TABLE IF NOT EXISTS productos_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establecimiento_id UUID NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  nombre VARCHAR(180) NOT NULL,
  categoria VARCHAR(20) NOT NULL CHECK (categoria IN ('minibar', 'tienda', 'general')),
  unidad VARCHAR(40) NOT NULL DEFAULT 'unidad',
  costo NUMERIC(12, 2) NOT NULL CHECK (costo >= 0),
  precio_venta NUMERIC(12, 2) NOT NULL CHECK (precio_venta > 0),
  stock_minimo NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS productos_inventario_nombre_unique
  ON productos_inventario (establecimiento_id, LOWER(nombre));

CREATE TABLE IF NOT EXISTS ubicaciones_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establecimiento_id UUID NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  habitacion_id UUID REFERENCES habitaciones(id) ON DELETE CASCADE,
  nombre VARCHAR(180) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('bodega', 'minibar', 'tienda')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((tipo = 'minibar') = (habitacion_id IS NOT NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS ubicaciones_inventario_nombre_unique
  ON ubicaciones_inventario (establecimiento_id, LOWER(nombre));
CREATE UNIQUE INDEX IF NOT EXISTS ubicaciones_minibar_habitacion_unique
  ON ubicaciones_inventario (habitacion_id) WHERE tipo = 'minibar';

CREATE TABLE IF NOT EXISTS inventario_existencias (
  producto_id UUID NOT NULL REFERENCES productos_inventario(id) ON DELETE RESTRICT,
  ubicacion_id UUID NOT NULL REFERENCES ubicaciones_inventario(id) ON DELETE RESTRICT,
  cantidad NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (producto_id, ubicacion_id)
);

CREATE TABLE IF NOT EXISTS huespedes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establecimiento_id UUID NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  nombres VARCHAR(120) NOT NULL,
  apellidos VARCHAR(120) NOT NULL,
  tipo_documento VARCHAR(40),
  numero_documento VARCHAR(80),
  telefono VARCHAR(40),
  correo VARCHAR(254),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS huespedes_establecimiento_documento_idx
  ON huespedes (establecimiento_id, numero_documento);
CREATE UNIQUE INDEX IF NOT EXISTS huespedes_documento_unique
  ON huespedes (establecimiento_id, tipo_documento, numero_documento)
  WHERE tipo_documento IS NOT NULL AND numero_documento IS NOT NULL;

CREATE TABLE IF NOT EXISTS estadias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establecimiento_id UUID NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  habitacion_id UUID NOT NULL REFERENCES habitaciones(id) ON DELETE RESTRICT,
  huesped_id UUID NOT NULL REFERENCES huespedes(id) ON DELETE RESTRICT,
  tarifa_noche NUMERIC(12, 2) NOT NULL CHECK (tarifa_noche > 0),
  estado VARCHAR(20) NOT NULL DEFAULT 'activa'
    CHECK (estado IN ('activa', 'cerrada')),
  entrada_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  salida_at TIMESTAMPTZ,
  creada_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((estado = 'activa' AND salida_at IS NULL)
      OR (estado = 'cerrada' AND salida_at IS NOT NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS estadias_habitacion_activa_unique
  ON estadias (habitacion_id) WHERE estado = 'activa';
CREATE INDEX IF NOT EXISTS estadias_establecimiento_entrada_idx
  ON estadias (establecimiento_id, entrada_at DESC);

CREATE TABLE IF NOT EXISTS cargos_estadia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estadia_id UUID NOT NULL REFERENCES estadias(id) ON DELETE RESTRICT,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('alojamiento', 'minibar', 'tienda')),
  producto_id UUID REFERENCES productos_inventario(id) ON DELETE RESTRICT,
  descripcion VARCHAR(240) NOT NULL,
  cantidad NUMERIC(12, 3) NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC(12, 2) NOT NULL CHECK (precio_unitario >= 0),
  total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
  creado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((tipo = 'alojamiento' AND producto_id IS NULL)
      OR (tipo <> 'alojamiento' AND producto_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS cargos_estadia_estadia_idx
  ON cargos_estadia (estadia_id, created_at);

CREATE TABLE IF NOT EXISTS pagos_estadia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estadia_id UUID NOT NULL UNIQUE REFERENCES estadias(id) ON DELETE RESTRICT,
  monto NUMERIC(12, 2) NOT NULL CHECK (monto > 0),
  medio_pago VARCHAR(20) NOT NULL
    CHECK (medio_pago IN ('efectivo', 'tarjeta', 'transferencia')),
  recibido_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  pagado_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ventas_tienda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establecimiento_id UUID NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  ubicacion_id UUID NOT NULL REFERENCES ubicaciones_inventario(id) ON DELETE RESTRICT,
  total NUMERIC(12, 2) NOT NULL CHECK (total > 0),
  medio_pago VARCHAR(20) NOT NULL
    CHECK (medio_pago IN ('efectivo', 'tarjeta', 'transferencia')),
  vendida_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ventas_tienda_establecimiento_fecha_idx
  ON ventas_tienda (establecimiento_id, created_at DESC);

CREATE TABLE IF NOT EXISTS cierres_caja (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establecimiento_id UUID NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  desde_at TIMESTAMPTZ NOT NULL,
  hasta_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  efectivo_esperado NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (efectivo_esperado >= 0),
  tarjeta_esperada NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (tarjeta_esperada >= 0),
  transferencia_esperada NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (transferencia_esperada >= 0),
  efectivo_declarado NUMERIC(12, 2) NOT NULL CHECK (efectivo_declarado >= 0),
  diferencia_efectivo NUMERIC(12, 2) NOT NULL,
  operaciones INTEGER NOT NULL CHECK (operaciones > 0),
  nota VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (hasta_at >= desde_at)
);

CREATE INDEX IF NOT EXISTS cierres_caja_establecimiento_usuario_fecha_idx
  ON cierres_caja (establecimiento_id, usuario_id, hasta_at DESC);

CREATE TABLE IF NOT EXISTS items_venta_tienda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id UUID NOT NULL REFERENCES ventas_tienda(id) ON DELETE RESTRICT,
  producto_id UUID NOT NULL REFERENCES productos_inventario(id) ON DELETE RESTRICT,
  cantidad NUMERIC(12, 3) NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC(12, 2) NOT NULL CHECK (precio_unitario > 0),
  costo_unitario NUMERIC(12, 2) NOT NULL CHECK (costo_unitario >= 0),
  total NUMERIC(12, 2) NOT NULL CHECK (total > 0)
);

CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establecimiento_id UUID NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos_inventario(id) ON DELETE RESTRICT,
  origen_id UUID REFERENCES ubicaciones_inventario(id) ON DELETE RESTRICT,
  destino_id UUID REFERENCES ubicaciones_inventario(id) ON DELETE RESTRICT,
  tipo VARCHAR(20) NOT NULL CHECK (
    tipo IN ('ingreso', 'ajuste', 'traslado', 'venta', 'consumo')
  ),
  cantidad NUMERIC(12, 3) NOT NULL CHECK (cantidad > 0),
  cargo_estadia_id UUID REFERENCES cargos_estadia(id) ON DELETE RESTRICT,
  item_venta_id UUID REFERENCES items_venta_tienda(id) ON DELETE RESTRICT,
  nota VARCHAR(500),
  creado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (tipo = 'ingreso' AND origen_id IS NULL AND destino_id IS NOT NULL)
    OR (tipo = 'traslado' AND origen_id IS NOT NULL AND destino_id IS NOT NULL
        AND origen_id <> destino_id)
    OR (tipo IN ('venta', 'consumo') AND origen_id IS NOT NULL AND destino_id IS NULL)
    OR (tipo = 'ajuste' AND ((origen_id IS NULL) <> (destino_id IS NULL)))
  )
);

CREATE INDEX IF NOT EXISTS movimientos_inventario_establecimiento_fecha_idx
  ON movimientos_inventario (establecimiento_id, created_at DESC);
