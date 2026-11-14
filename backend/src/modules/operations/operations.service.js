const { withTransaction } = require('../../database/transaction');
const { HttpError } = require('../../lib/httpError');
const { recordAudit } = require('../../lib/audit');
const operationsModel = require('./operations.model');

function assertProductFitsLocation(product, location) {
  if (location.tipo === 'bodega') {
    throw new HttpError(400, 'Usa una ubicación de tienda o minibar para vender o cargar consumos.');
  }
  if (product.categoria !== 'general' && product.categoria !== location.tipo) {
    throw new HttpError(400, 'La categoría del producto no corresponde a la ubicación.');
  }
}

function assertProductTransferFits(product, location) {
  if (location.tipo !== 'bodega'
    && product.categoria !== 'general'
    && product.categoria !== location.tipo) {
    throw new HttpError(400, 'La categoría del producto no corresponde a la ubicación.');
  }
}

function assertStockChanged(stock, quantity) {
  if (!stock) {
    throw new HttpError(409, `No hay existencias suficientes; se requieren ${quantity}.`);
  }
}

async function listProducts(establishmentId) {
  return operationsModel.findProducts(establishmentId);
}

async function listLocations(establishmentId) {
  return operationsModel.findLocations(establishmentId);
}

async function listMovements(establishmentId) {
  return operationsModel.findMovements(establishmentId);
}

async function createProduct(actor, values) {
  try {
    return await withTransaction(async (client) => {
      const product = await operationsModel.createProduct(
        client,
        actor.establecimiento_id,
        values,
      );
      await recordAudit(client, {
        establishmentId: actor.establecimiento_id,
        userId: actor.id,
        action: 'producto_inventario_creado',
        entity: 'productos_inventario',
        recordId: product.id,
        details: { nombre: product.nombre, categoria: product.categoria },
      });
      return product;
    });
  } catch (error) {
    if (error.code === '23505') {
      throw new HttpError(409, 'Ya existe un producto con ese nombre.');
    }
    throw error;
  }
}

async function updateProduct(actor, productId, values) {
  try {
    return await withTransaction(async (client) => {
      const product = await operationsModel.updateProduct(
        client,
        actor.establecimiento_id,
        productId,
        values,
      );
      if (!product) {
        throw new HttpError(404, 'No se encontró un producto activo.');
      }
      await recordAudit(client, {
        establishmentId: actor.establecimiento_id,
        userId: actor.id,
        action: 'producto_inventario_actualizado',
        entity: 'productos_inventario',
        recordId: product.id,
        details: { nombre: product.nombre },
      });
      return product;
    });
  } catch (error) {
    if (error.code === '23505') {
      throw new HttpError(409, 'Ya existe un producto con ese nombre.');
    }
    throw error;
  }
}

async function createLocation(actor, values) {
  try {
    return await withTransaction(async (client) => {
      if (values.tipo === 'minibar') {
        const room = await operationsModel.findRoomForLocation(
          client,
          values.habitacion_id,
          actor.establecimiento_id,
        );
        if (!room) {
          throw new HttpError(404, 'No se encontró una habitación activa del hotel.');
        }
        if (!room.minibar) {
          throw new HttpError(400, 'Activa la opción de minibar en la habitación antes de crear su ubicación.');
        }
      }

      const location = await operationsModel.createLocation(
        client,
        actor.establecimiento_id,
        values,
      );
      await recordAudit(client, {
        establishmentId: actor.establecimiento_id,
        userId: actor.id,
        action: 'ubicacion_inventario_creada',
        entity: 'ubicaciones_inventario',
        recordId: location.id,
        details: { tipo: location.tipo, nombre: location.nombre },
      });
      return location;
    });
  } catch (error) {
    if (error.code === '23505') {
      throw new HttpError(409, 'Ya existe una ubicación o minibar con ese nombre.');
    }
    throw error;
  }
}

async function changeStock(actor, values) {
  return withTransaction(async (client) => {
    const product = await operationsModel.findStockContext(
      client,
      values.producto_id,
      values.ubicacion_id,
      actor.establecimiento_id,
    );
    if (!product) {
      throw new HttpError(404, 'No se encontró el producto o la ubicación.');
    }
    assertProductTransferFits(product, { tipo: product.tipo_ubicacion });

    const stock = await operationsModel.changeStock(
      client,
      product.producto_id,
      product.ubicacion_id,
      values.cantidad,
    );
    assertStockChanged(stock, Math.abs(values.cantidad));

    const destination = values.cantidad > 0 ? product.ubicacion_id : null;
    const source = values.cantidad < 0 ? product.ubicacion_id : null;
    const movement = await operationsModel.createMovement(
      client,
      actor.establecimiento_id,
      actor.id,
      {
        producto_id: product.producto_id,
        origen_id: source,
        destino_id: destination,
        tipo: values.tipo,
        cantidad: Math.abs(values.cantidad),
        nota: values.nota,
      },
    );
    await recordAudit(client, {
      establishmentId: actor.establecimiento_id,
      userId: actor.id,
      action: values.tipo === 'ingreso' ? 'inventario_ingresado' : 'inventario_ajustado',
      entity: 'movimientos_inventario',
      recordId: movement.id,
      details: { cantidad: values.cantidad, producto: product.producto },
    });
    return { ...movement, existencias: stock.cantidad };
  });
}

async function transferStock(actor, values) {
  return withTransaction(async (client) => {
    const locationIds = [values.origen_id, values.destino_id].sort();
    const locations = [];
    for (const id of locationIds) {
      const location = await operationsModel.findOwnedLocation(
        client,
        id,
        actor.establecimiento_id,
      );
      if (!location) {
        throw new HttpError(404, 'No se encontró una de las ubicaciones.');
      }
      locations.push(location);
    }
    const source = locations.find((location) => location.id === values.origen_id);
    const destination = locations.find((location) => location.id === values.destino_id);
    const product = await operationsModel.findStockContext(
      client,
      values.producto_id,
      source.id,
      actor.establecimiento_id,
    );
    if (!product) {
      throw new HttpError(404, 'No se encontró el producto en el hotel.');
    }
    const destinationProduct = await operationsModel.findStockContext(
      client,
      values.producto_id,
      destination.id,
      actor.establecimiento_id,
    );
    if (!destinationProduct) {
      throw new HttpError(404, 'No se encontró el producto en el hotel.');
    }
    assertProductTransferFits(product, source);
    assertProductTransferFits(product, destination);

    const stock = await operationsModel.changeStock(
      client,
      product.producto_id,
      source.id,
      -values.cantidad,
    );
    assertStockChanged(stock, values.cantidad);
    await operationsModel.changeStock(
      client,
      product.producto_id,
      destination.id,
      values.cantidad,
    );
    const movement = await operationsModel.createMovement(
      client,
      actor.establecimiento_id,
      actor.id,
      {
        producto_id: product.producto_id,
        origen_id: source.id,
        destino_id: destination.id,
        tipo: 'traslado',
        cantidad: values.cantidad,
        nota: values.nota,
      },
    );
    await recordAudit(client, {
      establishmentId: actor.establecimiento_id,
      userId: actor.id,
      action: 'inventario_trasladado',
      entity: 'movimientos_inventario',
      recordId: movement.id,
      details: { cantidad: values.cantidad, producto: product.producto },
    });
    return movement;
  });
}

async function checkIn(actor, values) {
  try {
    return await withTransaction(async (client) => {
      const room = await operationsModel.findRoomForCheckIn(
        client,
        values.habitacion_id,
        actor.establecimiento_id,
      );
      if (!room) {
        throw new HttpError(404, 'No se encontró la habitación del hotel.');
      }
      if (room.estado !== 'disponible') {
        throw new HttpError(409, 'La habitación no está disponible para el check-in.');
      }
      if (!room.tarifa_noche) {
        throw new HttpError(400, 'La habitación debe tener una tarifa de modalidad “Noche” para iniciar una estadía.');
      }

      let guest = await operationsModel.findGuestByDocument(
        client,
        actor.establecimiento_id,
        values.numero_documento,
      );
      guest = guest
        ? await operationsModel.updateGuest(client, guest.id, values)
        : await operationsModel.createGuest(client, actor.establecimiento_id, values);

      const stay = await operationsModel.createStay(
        client,
        actor.establecimiento_id,
        room.id,
        guest.id,
        actor.id,
        room.tarifa_noche,
      );
      await operationsModel.setRoomState(client, room.id, 'ocupada');
      await recordAudit(client, {
        establishmentId: actor.establecimiento_id,
        userId: actor.id,
        action: 'estadia_iniciada',
        entity: 'estadias',
        recordId: stay.id,
        details: { habitacion: room.numero, huesped: `${guest.nombres} ${guest.apellidos}` },
      });
      return {
        ...stay,
        id: stay.id,
        huesped_id: guest.id,
        habitacion: room.numero,
        huesped: guest,
      };
    });
  } catch (error) {
    if (error.code === '23505') {
      throw new HttpError(409, 'La habitación ya tiene una estadía activa o el huésped ya está registrado.');
    }
    throw error;
  }
}

async function listActiveStays(establishmentId) {
  return operationsModel.findActiveStays(establishmentId);
}

async function addStayCharge(actor, stayId, values) {
  return withTransaction(async (client) => {
    const stay = await operationsModel.findActiveStay(
      client,
      stayId,
      actor.establecimiento_id,
    );
    if (!stay) {
      throw new HttpError(404, 'No se encontró una estadía activa.');
    }

    const product = await operationsModel.findStockContext(
      client,
      values.producto_id,
      values.ubicacion_id,
      actor.establecimiento_id,
    );
    if (!product) {
      throw new HttpError(404, 'No se encontró el producto o la ubicación.');
    }
    const location = {
      id: product.ubicacion_id,
      tipo: product.tipo_ubicacion,
      habitacion_id: product.habitacion_id,
    };
    assertProductFitsLocation(product, location);
    if (location.tipo === 'minibar' && location.habitacion_id !== stay.habitacion_id) {
      throw new HttpError(400, 'El minibar seleccionado no pertenece a la habitación de esta estadía.');
    }
    if (Math.round(Number(product.precio_venta) * values.cantidad * 100) < 1) {
      throw new HttpError(400, 'El importe del consumo debe ser de al menos un centavo.');
    }

    const stock = await operationsModel.changeStock(
      client,
      product.producto_id,
      product.ubicacion_id,
      -values.cantidad,
    );
    assertStockChanged(stock, values.cantidad);
    const chargeType = location.tipo === 'minibar' ? 'minibar' : 'tienda';
    const charge = await operationsModel.createStayCharge(
      client,
      stay.id,
      product,
      values.cantidad,
      chargeType,
      actor.id,
    );
    await operationsModel.createMovement(
      client,
      actor.establecimiento_id,
      actor.id,
      {
        producto_id: product.producto_id,
        origen_id: product.ubicacion_id,
        destino_id: null,
        tipo: chargeType === 'minibar' ? 'consumo' : 'venta',
        cantidad: values.cantidad,
        cargo_estadia_id: charge.id,
      },
    );
    await recordAudit(client, {
      establishmentId: actor.establecimiento_id,
      userId: actor.id,
      action: 'cargo_estadia_creado',
      entity: 'cargos_estadia',
      recordId: charge.id,
      details: { tipo: chargeType, producto: product.producto, cantidad: values.cantidad },
    });
    return charge;
  });
}

async function checkout(actor, stayId, values) {
  return withTransaction(async (client) => {
    const cashierExists = await operationsModel.lockCashier(
      client,
      actor.establecimiento_id,
      actor.id,
    );
    if (!cashierExists) {
      throw new HttpError(404, 'No se encontró el usuario activo para registrar el pago.');
    }
    const stay = await operationsModel.findActiveStay(
      client,
      stayId,
      actor.establecimiento_id,
    );
    if (!stay) {
      throw new HttpError(404, 'No se encontró una estadía activa.');
    }
    const nightsResult = await client.query(
      `SELECT GREATEST(1, CURRENT_DATE - ($1::TIMESTAMPTZ)::DATE)::INTEGER AS noches`,
      [stay.entrada_at],
    );
    const nights = nightsResult.rows[0].noches;
    const accommodation = await operationsModel.createAccommodationCharge(
      client,
      stay,
      nights,
      actor.id,
    );
    const total = await operationsModel.sumStayCharges(client, stay.id);
    const payment = await operationsModel.createStayPayment(
      client,
      stay.id,
      total,
      values.medio_pago,
      actor.id,
    );
    const closedStay = await operationsModel.closeStay(client, stay.id);
    if (!closedStay) {
      throw new HttpError(409, 'La estadía ya fue cerrada.');
    }
    await operationsModel.setRoomState(client, stay.habitacion_id, 'disponible');
    await recordAudit(client, {
      establishmentId: actor.establecimiento_id,
      userId: actor.id,
      action: 'estadia_cerrada',
      entity: 'estadias',
      recordId: stay.id,
      details: { noches, total, medio_pago: values.medio_pago },
    });
    return {
      estadia_id: stay.id,
      habitacion: stay.habitacion,
      noches,
      cargo_alojamiento: accommodation.total,
      total,
      pago: payment,
    };
  });
}

async function createSale(actor, values) {
  return withTransaction(async (client) => {
    const cashierExists = await operationsModel.lockCashier(
      client,
      actor.establecimiento_id,
      actor.id,
    );
    if (!cashierExists) {
      throw new HttpError(404, 'No se encontró el usuario activo para registrar la venta.');
    }
    const location = await operationsModel.findOwnedLocation(
      client,
      values.ubicacion_id,
      actor.establecimiento_id,
    );
    if (!location) {
      throw new HttpError(404, 'No se encontró la ubicación.');
    }
    if (location.tipo !== 'tienda') {
      throw new HttpError(400, 'Las ventas directas deben registrarse desde una ubicación de tienda.');
    }

    const products = [];
    for (const item of [...values.items].sort((a, b) => a.producto_id.localeCompare(b.producto_id))) {
      const product = await operationsModel.findStockContext(
        client,
        item.producto_id,
        location.id,
        actor.establecimiento_id,
      );
      if (!product) {
        throw new HttpError(404, 'No se encontró uno de los productos.');
      }
      assertProductFitsLocation(product, location);
      products.push({ ...product, cantidad: item.cantidad });
    }

    const total = products.reduce(
      (sum, product) => sum + Math.round(Number(product.precio_venta) * product.cantidad * 100) / 100,
      0,
    );
    if (products.some((product) => (
      Math.round(Number(product.precio_venta) * product.cantidad * 100) < 1
    ))) {
      throw new HttpError(400, 'Cada línea de venta debe ser de al menos un centavo.');
    }
    if (!Number.isFinite(total) || total <= 0) {
      throw new HttpError(400, 'El total de la venta debe ser mayor que cero.');
    }
    const sale = await operationsModel.createSale(
      client,
      actor.establecimiento_id,
      actor.id,
      location.id,
      values.medio_pago,
      total,
    );

    const items = [];
    for (const product of products) {
      const stock = await operationsModel.changeStock(
        client,
        product.producto_id,
        location.id,
        -product.cantidad,
      );
      assertStockChanged(stock, product.cantidad);
      const item = await operationsModel.createSaleItem(
        client,
        sale.id,
        product,
        product.cantidad,
      );
      items.push(item);
      await operationsModel.createMovement(
        client,
        actor.establecimiento_id,
        actor.id,
        {
          producto_id: product.producto_id,
          origen_id: location.id,
          destino_id: null,
          tipo: 'venta',
          cantidad: product.cantidad,
          item_venta_id: item.id,
        },
      );
    }
    await recordAudit(client, {
      establishmentId: actor.establecimiento_id,
      userId: actor.id,
      action: 'venta_tienda_registrada',
      entity: 'ventas_tienda',
      recordId: sale.id,
      details: { total, medio_pago: values.medio_pago, productos: items.length },
    });
    return { ...sale, items };
  });
}

async function getCashSummary(actor) {
  return withTransaction(async (client) => {
    const cashierExists = await operationsModel.lockCashier(
      client,
      actor.establecimiento_id,
      actor.id,
    );
    if (!cashierExists) {
      throw new HttpError(404, 'No se encontró el usuario activo para consultar caja.');
    }
    return operationsModel.findCashSummary(
      client,
      actor.establecimiento_id,
      actor.id,
    );
  });
}

async function closeCash(actor, values) {
  return withTransaction(async (client) => {
    const cashierExists = await operationsModel.lockCashier(
      client,
      actor.establecimiento_id,
      actor.id,
    );
    if (!cashierExists) {
      throw new HttpError(404, 'No se encontró el usuario activo para cerrar caja.');
    }
    const summary = await operationsModel.findCashSummary(
      client,
      actor.establecimiento_id,
      actor.id,
    );
    if (Number(summary.operaciones) === 0) {
      throw new HttpError(409, 'No hay pagos registrados desde el último cierre de caja.');
    }
    const closing = await operationsModel.createCashClose(
      client,
      actor.establecimiento_id,
      actor.id,
      summary,
      values,
    );
    await recordAudit(client, {
      establishmentId: actor.establecimiento_id,
      userId: actor.id,
      action: 'caja_cerrada',
      entity: 'cierres_caja',
      recordId: closing.id,
      details: {
        operaciones: summary.operaciones,
        efectivo_esperado: summary.efectivo,
        efectivo_declarado: values.efectivo_declarado,
      },
    });
    return closing;
  });
}

async function getRevenue(establishmentId, from, to) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)
    || Number.isNaN(Date.parse(`${from}T00:00:00Z`))
    || new Date(`${from}T00:00:00Z`).toISOString().slice(0, 10) !== from
    || Number.isNaN(Date.parse(`${to}T00:00:00Z`))
    || new Date(`${to}T00:00:00Z`).toISOString().slice(0, 10) !== to
    || from > to) {
    throw new HttpError(400, 'Indica un rango de fechas válido en formato AAAA-MM-DD.');
  }
  const rows = await operationsModel.findRevenue(establishmentId, from, to);
  const byType = Object.fromEntries(rows.map((row) => [row.tipo, {
    total: Number(row.total),
    operaciones: row.operaciones,
  }]));
  const accommodation = byType.alojamiento || { total: 0, operaciones: 0 };
  const minibar = byType.minibar || { total: 0, operaciones: 0 };
  const storeFromStays = byType.tienda || { total: 0, operaciones: 0 };
  return {
    desde: from,
    hasta: to,
    alojamiento: accommodation,
    minibar,
    tienda: {
      total: storeFromStays.total,
      operaciones: Number(storeFromStays.operaciones),
    },
    total: accommodation.total + minibar.total + storeFromStays.total,
  };
}

module.exports = {
  addStayCharge,
  changeStock,
  checkIn,
  closeCash,
  checkout,
  createLocation,
  createProduct,
  createSale,
  getCashSummary,
  getRevenue,
  listActiveStays,
  listLocations,
  listMovements,
  listProducts,
  transferStock,
  updateProduct,
};
