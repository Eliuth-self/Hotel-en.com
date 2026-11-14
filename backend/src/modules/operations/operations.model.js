const { pool } = require('../../config/database');

async function findProducts(establishmentId) {
  const result = await pool.query(
    `SELECT p.id, p.nombre, p.categoria, p.unidad, p.costo, p.precio_venta,
            p.stock_minimo, p.activo, p.created_at, p.updated_at,
            COALESCE(
              JSON_AGG(JSON_BUILD_OBJECT(
                'ubicacion_id', l.id,
                'ubicacion', l.nombre,
                'tipo', l.tipo,
                'cantidad', s.cantidad
              ) ORDER BY l.nombre) FILTER (WHERE l.id IS NOT NULL),
              '[]'::JSON
            ) AS existencias
       FROM productos_inventario p
       LEFT JOIN inventario_existencias s ON s.producto_id = p.id
       LEFT JOIN ubicaciones_inventario l ON l.id = s.ubicacion_id
      WHERE p.establecimiento_id = $1 AND p.activo = TRUE
      GROUP BY p.id
      ORDER BY p.nombre`,
    [establishmentId],
  );
  return result.rows;
}

async function findLocations(establishmentId) {
  const result = await pool.query(
    `SELECT l.id, l.nombre, l.tipo, l.habitacion_id, h.numero AS habitacion,
            COALESCE(
              JSON_AGG(JSON_BUILD_OBJECT(
                'producto_id', p.id,
                'producto', p.nombre,
                'unidad', p.unidad,
                'cantidad', s.cantidad
              ) ORDER BY p.nombre) FILTER (WHERE p.id IS NOT NULL),
              '[]'::JSON
            ) AS existencias
       FROM ubicaciones_inventario l
       LEFT JOIN habitaciones h ON h.id = l.habitacion_id
       LEFT JOIN inventario_existencias s ON s.ubicacion_id = l.id
       LEFT JOIN productos_inventario p ON p.id = s.producto_id AND p.activo = TRUE
      WHERE l.establecimiento_id = $1
      GROUP BY l.id, h.numero
      ORDER BY l.tipo, l.nombre`,
    [establishmentId],
  );
  return result.rows;
}

async function findMovements(establishmentId) {
  const result = await pool.query(
    `SELECT m.id, m.tipo, m.cantidad, m.nota, m.created_at,
            p.nombre AS producto,
            src.nombre AS origen,
            dst.nombre AS destino,
            u.nombres || ' ' || u.apellidos AS usuario
       FROM movimientos_inventario m
       JOIN productos_inventario p ON p.id = m.producto_id
       LEFT JOIN ubicaciones_inventario src ON src.id = m.origen_id
       LEFT JOIN ubicaciones_inventario dst ON dst.id = m.destino_id
       LEFT JOIN usuarios u ON u.id = m.creado_por
      WHERE m.establecimiento_id = $1
      ORDER BY m.created_at DESC
      LIMIT 100`,
    [establishmentId],
  );
  return result.rows;
}

async function createProduct(client, establishmentId, values) {
  const result = await client.query(
    `INSERT INTO productos_inventario
      (establecimiento_id, nombre, categoria, unidad, costo, precio_venta, stock_minimo)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, nombre, categoria, unidad, costo, precio_venta,
               stock_minimo, activo, created_at, updated_at`,
    [
      establishmentId,
      values.nombre,
      values.categoria,
      values.unidad,
      values.costo,
      values.precio_venta,
      values.stock_minimo,
    ],
  );
  return result.rows[0];
}

async function updateProduct(client, establishmentId, productId, values) {
  const result = await client.query(
    `UPDATE productos_inventario
        SET nombre = $3, categoria = $4, unidad = $5, costo = $6,
            precio_venta = $7, stock_minimo = $8, updated_at = NOW()
      WHERE establecimiento_id = $1 AND id = $2 AND activo = TRUE
      RETURNING id, nombre, categoria, unidad, costo, precio_venta,
                stock_minimo, activo, created_at, updated_at`,
    [
      establishmentId,
      productId,
      values.nombre,
      values.categoria,
      values.unidad,
      values.costo,
      values.precio_venta,
      values.stock_minimo,
    ],
  );
  return result.rows[0] || null;
}

async function createLocation(client, establishmentId, values) {
  const result = await client.query(
    `INSERT INTO ubicaciones_inventario
      (establecimiento_id, habitacion_id, nombre, tipo)
     VALUES ($1, $2, $3, $4)
     RETURNING id, nombre, tipo, habitacion_id`,
    [establishmentId, values.habitacion_id, values.nombre, values.tipo],
  );
  return result.rows[0];
}

async function findRoomForLocation(client, roomId, establishmentId) {
  const result = await client.query(
    `SELECT id, numero, minibar
       FROM habitaciones
      WHERE id = $1 AND establecimiento_id = $2 AND estado <> 'inactiva'
      FOR UPDATE`,
    [roomId, establishmentId],
  );
  return result.rows[0] || null;
}

async function findRoomForCheckIn(client, roomId, establishmentId) {
  const result = await client.query(
    `SELECT h.id, h.numero, h.estado,
            (SELECT t.precio
               FROM tarifas_habitaciones t
              WHERE t.habitacion_id = h.id
                AND LOWER(t.modalidad) = 'noche'
                AND t.moneda = 'COP'
              ORDER BY t.duracion_minutos NULLS FIRST, t.created_at DESC
              LIMIT 1) AS tarifa_noche
       FROM habitaciones h
      WHERE h.id = $1 AND h.establecimiento_id = $2
      FOR UPDATE OF h`,
    [roomId, establishmentId],
  );
  return result.rows[0] || null;
}

async function findGuestByDocument(client, establishmentId, documentNumber) {
  if (!documentNumber) return null;
  const result = await client.query(
    `SELECT id
       FROM huespedes
      WHERE establecimiento_id = $1 AND numero_documento = $2
      ORDER BY created_at DESC
      LIMIT 1
      FOR UPDATE`,
    [establishmentId, documentNumber],
  );
  return result.rows[0] || null;
}

async function createGuest(client, establishmentId, values) {
  const result = await client.query(
    `INSERT INTO huespedes
      (establecimiento_id, nombres, apellidos, tipo_documento, numero_documento, telefono, correo)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, nombres, apellidos, tipo_documento, numero_documento, telefono, correo`,
    [
      establishmentId,
      values.nombres,
      values.apellidos,
      values.tipo_documento,
      values.numero_documento,
      values.telefono,
      values.correo,
    ],
  );
  return result.rows[0];
}

async function updateGuest(client, guestId, values) {
  const result = await client.query(
    `UPDATE huespedes
        SET nombres = $2, apellidos = $3, tipo_documento = $4,
            numero_documento = $5, telefono = $6, correo = $7
      WHERE id = $1
      RETURNING id, nombres, apellidos, tipo_documento, numero_documento, telefono, correo`,
    [
      guestId,
      values.nombres,
      values.apellidos,
      values.tipo_documento,
      values.numero_documento,
      values.telefono,
      values.correo,
    ],
  );
  return result.rows[0];
}

async function createStay(client, establishmentId, roomId, guestId, userId, nightlyRate) {
  const result = await client.query(
    `INSERT INTO estadias
      (establecimiento_id, habitacion_id, huesped_id, tarifa_noche, creada_por)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, habitacion_id, huesped_id, tarifa_noche, estado, entrada_at`,
    [establishmentId, roomId, guestId, nightlyRate, userId],
  );
  return result.rows[0];
}

async function setRoomState(client, roomId, state) {
  await client.query(
    `UPDATE habitaciones SET estado = $2, updated_at = NOW() WHERE id = $1`,
    [roomId, state],
  );
}

async function findActiveStays(establishmentId) {
  const result = await pool.query(
    `SELECT s.id, s.habitacion_id, h.numero AS habitacion, h.ubicacion,
            s.huesped_id, g.nombres, g.apellidos, g.tipo_documento,
            g.numero_documento, g.telefono, s.tarifa_noche, s.entrada_at,
            COALESCE((
              SELECT JSON_AGG(JSON_BUILD_OBJECT(
                'id', c.id,
                'tipo', c.tipo,
                'descripcion', c.descripcion,
                'cantidad', c.cantidad,
                'precio_unitario', c.precio_unitario,
                'total', c.total,
                'created_at', c.created_at
              ) ORDER BY c.created_at)
              FROM cargos_estadia c WHERE c.estadia_id = s.id
            ), '[]'::JSON) AS cargos
       FROM estadias s
       JOIN habitaciones h ON h.id = s.habitacion_id
       JOIN huespedes g ON g.id = s.huesped_id
      WHERE s.establecimiento_id = $1 AND s.estado = 'activa'
      ORDER BY s.entrada_at`,
    [establishmentId],
  );
  return result.rows;
}

async function findActiveStay(client, stayId, establishmentId) {
  const result = await client.query(
    `SELECT s.id, s.habitacion_id, s.tarifa_noche, s.entrada_at,
            h.numero AS habitacion, g.nombres, g.apellidos
       FROM estadias s
       JOIN habitaciones h ON h.id = s.habitacion_id
       JOIN huespedes g ON g.id = s.huesped_id
      WHERE s.id = $1 AND s.establecimiento_id = $2 AND s.estado = 'activa'
      FOR UPDATE OF s`,
    [stayId, establishmentId],
  );
  return result.rows[0] || null;
}

async function findStockContext(client, productId, locationId, establishmentId) {
  const result = await client.query(
    `SELECT p.id AS producto_id, p.nombre AS producto, p.categoria, p.unidad,
            p.costo, p.precio_venta, l.id AS ubicacion_id, l.nombre AS ubicacion,
            l.tipo AS tipo_ubicacion, l.habitacion_id
       FROM productos_inventario p
       JOIN ubicaciones_inventario l ON l.establecimiento_id = p.establecimiento_id
      WHERE p.id = $1 AND l.id = $2
        AND p.establecimiento_id = $3 AND p.activo = TRUE`,
    [productId, locationId, establishmentId],
  );
  return result.rows[0] || null;
}

async function findOwnedLocation(client, locationId, establishmentId) {
  const result = await client.query(
    `SELECT id, nombre, tipo, habitacion_id
       FROM ubicaciones_inventario
      WHERE id = $1 AND establecimiento_id = $2
      FOR UPDATE`,
    [locationId, establishmentId],
  );
  return result.rows[0] || null;
}

async function changeStock(client, productId, locationId, delta) {
  if (delta > 0) {
    const result = await client.query(
      `INSERT INTO inventario_existencias (producto_id, ubicacion_id, cantidad)
       VALUES ($1, $2, $3)
       ON CONFLICT (producto_id, ubicacion_id)
       DO UPDATE SET cantidad = inventario_existencias.cantidad + EXCLUDED.cantidad,
                     updated_at = NOW()
       RETURNING cantidad`,
      [productId, locationId, delta],
    );
    return result.rows[0];
  }
  const result = await client.query(
    `UPDATE inventario_existencias
        SET cantidad = cantidad - $3, updated_at = NOW()
      WHERE producto_id = $1 AND ubicacion_id = $2 AND cantidad >= $3
      RETURNING cantidad`,
    [productId, locationId, Math.abs(delta)],
  );
  return result.rows[0] || null;
}

async function createMovement(client, establishmentId, userId, values) {
  const result = await client.query(
    `INSERT INTO movimientos_inventario
      (establecimiento_id, producto_id, origen_id, destino_id, tipo,
       cantidad, cargo_estadia_id, item_venta_id, nota, creado_por)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id, tipo, cantidad, created_at`,
    [
      establishmentId,
      values.producto_id,
      values.origen_id,
      values.destino_id,
      values.tipo,
      values.cantidad,
      values.cargo_estadia_id || null,
      values.item_venta_id || null,
      values.nota || null,
      userId,
    ],
  );
  return result.rows[0];
}

async function createStayCharge(client, stayId, product, quantity, type, userId) {
  const result = await client.query(
    `INSERT INTO cargos_estadia
      (estadia_id, tipo, producto_id, descripcion, cantidad, precio_unitario, total, creado_por)
     VALUES ($1, $2, $3, $4, $5, $6, ROUND($5::NUMERIC * $6::NUMERIC, 2), $7)
     RETURNING id, tipo, producto_id, descripcion, cantidad, precio_unitario, total, created_at`,
    [
      stayId,
      type,
      product.producto_id,
      product.producto,
      quantity,
      product.precio_venta,
      userId,
    ],
  );
  return result.rows[0];
}

async function createSale(client, establishmentId, userId, locationId, paymentMethod, total) {
  const result = await client.query(
    `INSERT INTO ventas_tienda
      (establecimiento_id, ubicacion_id, total, medio_pago, vendida_por, created_at)
     VALUES ($1, $2, $3, $4, $5, clock_timestamp())
     RETURNING id, ubicacion_id, total, medio_pago, created_at`,
    [establishmentId, locationId, total, paymentMethod, userId],
  );
  return result.rows[0];
}

async function createSaleItem(client, saleId, product, quantity) {
  const result = await client.query(
    `INSERT INTO items_venta_tienda
      (venta_id, producto_id, cantidad, precio_unitario, costo_unitario, total)
     VALUES ($1, $2, $3, $4, $5, ROUND($3::NUMERIC * $4::NUMERIC, 2))
     RETURNING id, producto_id, cantidad, precio_unitario, costo_unitario, total`,
    [saleId, product.producto_id, quantity, product.precio_venta, product.costo],
  );
  return result.rows[0];
}

async function createAccommodationCharge(client, stay, nights, userId) {
  const result = await client.query(
    `INSERT INTO cargos_estadia
      (estadia_id, tipo, descripcion, cantidad, precio_unitario, total, creado_por)
     VALUES ($1, 'alojamiento', 'Alojamiento · habitación ' || $2,
             $3, $4, ROUND($3::NUMERIC * $4::NUMERIC, 2), $5)
     RETURNING id, tipo, descripcion, cantidad, precio_unitario, total`,
    [stay.id, stay.habitacion, nights, stay.tarifa_noche, userId],
  );
  return result.rows[0];
}

async function sumStayCharges(client, stayId) {
  const result = await client.query(
    `SELECT COALESCE(SUM(total), 0)::NUMERIC(12, 2) AS total
       FROM cargos_estadia WHERE estadia_id = $1`,
    [stayId],
  );
  return result.rows[0].total;
}

async function closeStay(client, stayId) {
  const result = await client.query(
    `UPDATE estadias SET estado = 'cerrada', salida_at = NOW()
      WHERE id = $1 AND estado = 'activa'
      RETURNING id, habitacion_id, salida_at`,
    [stayId],
  );
  return result.rows[0] || null;
}

async function createStayPayment(client, stayId, amount, paymentMethod, userId) {
  const result = await client.query(
    `INSERT INTO pagos_estadia (estadia_id, monto, medio_pago, recibido_por, pagado_at)
     VALUES ($1, $2, $3, $4, clock_timestamp())
     RETURNING id, estadia_id, monto, medio_pago, pagado_at`,
    [stayId, amount, paymentMethod, userId],
  );
  return result.rows[0];
}

async function lockCashier(client, establishmentId, userId) {
  const result = await client.query(
    `SELECT id FROM usuarios
      WHERE id = $1 AND establecimiento_id = $2 AND estado = TRUE
      FOR UPDATE`,
    [userId, establishmentId],
  );
  return result.rowCount > 0;
}

async function findCashSummary(client, establishmentId, userId) {
  const result = await client.query(
    `WITH bounds AS (
       SELECT COALESCE(MAX(hasta_at), 'epoch'::TIMESTAMPTZ) AS desde_at,
              clock_timestamp() AS hasta_at
         FROM cierres_caja
        WHERE establecimiento_id = $1 AND usuario_id = $2
     ),
     receipts AS (
       SELECT v.medio_pago, v.total AS monto, v.created_at AS recibido_at
         FROM ventas_tienda v, bounds b
        WHERE v.establecimiento_id = $1 AND v.vendida_por = $2
          AND v.created_at > b.desde_at AND v.created_at <= b.hasta_at
       UNION ALL
       SELECT p.medio_pago, p.monto, p.pagado_at AS recibido_at
         FROM pagos_estadia p
         JOIN estadias s ON s.id = p.estadia_id
         CROSS JOIN bounds b
        WHERE s.establecimiento_id = $1 AND p.recibido_por = $2
          AND p.pagado_at > b.desde_at AND p.pagado_at <= b.hasta_at
     )
     SELECT b.desde_at, b.hasta_at,
            COALESCE(SUM(r.monto) FILTER (WHERE r.medio_pago = 'efectivo'), 0)::NUMERIC(12, 2) AS efectivo,
            COALESCE(SUM(r.monto) FILTER (WHERE r.medio_pago = 'tarjeta'), 0)::NUMERIC(12, 2) AS tarjeta,
            COALESCE(SUM(r.monto) FILTER (WHERE r.medio_pago = 'transferencia'), 0)::NUMERIC(12, 2) AS transferencia,
            COUNT(r.recibido_at)::INTEGER AS operaciones
       FROM bounds b
       LEFT JOIN receipts r ON TRUE
      GROUP BY b.desde_at, b.hasta_at`,
    [establishmentId, userId],
  );
  return result.rows[0];
}

async function createCashClose(client, establishmentId, userId, summary, values) {
  const result = await client.query(
    `INSERT INTO cierres_caja
      (establecimiento_id, usuario_id, desde_at, hasta_at, efectivo_esperado,
       tarjeta_esperada, transferencia_esperada, efectivo_declarado,
       diferencia_efectivo, operaciones, nota)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8::NUMERIC - $5::NUMERIC, $9, $10)
     RETURNING id, desde_at, hasta_at, efectivo_esperado, tarjeta_esperada,
               transferencia_esperada, efectivo_declarado, diferencia_efectivo,
               operaciones, nota, created_at`,
    [
      establishmentId,
      userId,
      summary.desde_at,
      summary.hasta_at,
      summary.efectivo,
      summary.tarjeta,
      summary.transferencia,
      values.efectivo_declarado,
      summary.operaciones,
      values.nota,
    ],
  );
  return result.rows[0];
}

async function findRevenue(establishmentId, from, to) {
  const result = await pool.query(
    `SELECT ingresos.tipo,
            COALESCE(SUM(ingresos.total), 0)::NUMERIC(12, 2) AS total,
            COUNT(*)::INTEGER AS operaciones
       FROM (
         SELECT c.tipo, c.total
           FROM cargos_estadia c
           JOIN estadias s ON s.id = c.estadia_id
           JOIN pagos_estadia p ON p.estadia_id = s.id
          WHERE s.establecimiento_id = $1
            AND p.pagado_at >= $2::DATE
            AND p.pagado_at < ($3::DATE + INTERVAL '1 day')
         UNION ALL
         SELECT 'tienda' AS tipo, v.total
           FROM ventas_tienda v
          WHERE v.establecimiento_id = $1
            AND v.created_at >= $2::DATE
            AND v.created_at < ($3::DATE + INTERVAL '1 day')
       ) ingresos
      GROUP BY ingresos.tipo
      ORDER BY ingresos.tipo`,
    [establishmentId, from, to],
  );
  return result.rows;
}

module.exports = {
  changeStock,
  closeStay,
  createAccommodationCharge,
  createCashClose,
  createGuest,
  createLocation,
  createMovement,
  createProduct,
  createSale,
  createSaleItem,
  createStay,
  createStayCharge,
  createStayPayment,
  updateProduct,
  findActiveStay,
  findActiveStays,
  findCashSummary,
  findGuestByDocument,
  findLocations,
  findMovements,
  findProducts,
  findRevenue,
  findRoomForCheckIn,
  findRoomForLocation,
  findStockContext,
  findOwnedLocation,
  lockCashier,
  sumStayCharges,
  updateGuest,
  setRoomState,
};
