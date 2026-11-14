async function recordAudit(client, {
  establishmentId,
  userId,
  action,
  entity,
  recordId,
  details = {},
}) {
  await client.query(
    `INSERT INTO auditoria
      (establecimiento_id, usuario_id, accion, entidad_afectada, registro_id, descripcion)
     VALUES ($1, $2, $3, $4, $5, $6::JSONB)`,
    [
      establishmentId || null,
      userId || null,
      action,
      entity,
      recordId || null,
      JSON.stringify(details),
    ],
  );
}

module.exports = { recordAudit };
