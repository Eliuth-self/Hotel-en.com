async function createCompany(client, company) {
  const result = await client.query(
    `INSERT INTO empresas
      (razon_social, tipo_documento, numero_documento, correo_contacto, telefono)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, razon_social, tipo_documento, numero_documento,
               correo_contacto, telefono, estado, created_at`,
    [
      company.razon_social,
      company.tipo_documento,
      company.numero_documento,
      company.correo_contacto,
      company.telefono,
    ],
  );
  return result.rows[0];
}

async function createEstablishment(client, companyId, establishment) {
  const result = await client.query(
    `INSERT INTO establecimientos
      (empresa_id, nombre_comercial, tipo_establecimiento, municipio_id,
       division_territorial_id, direccion, telefono, whatsapp, correo, logo_url, descripcion)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING id, empresa_id, nombre_comercial, tipo_establecimiento, municipio_id,
               division_territorial_id, direccion, telefono, whatsapp, correo, logo_url,
               descripcion, estado, visible_publicamente, created_at`,
    [
      companyId,
      establishment.nombre_comercial,
      establishment.tipo_establecimiento,
      establishment.municipio_id,
      establishment.division_territorial_id,
      establishment.direccion,
      establishment.telefono,
      establishment.whatsapp,
      establishment.correo,
      establishment.logo_url,
      establishment.descripcion,
    ],
  );
  return result.rows[0];
}

async function createAdministrator(client, establishmentId, administrator, passwordHash) {
  const result = await client.query(
    `INSERT INTO usuarios
      (establecimiento_id, nombres, apellidos, correo, password_hash, telefono)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, establecimiento_id, nombres, apellidos, correo, telefono`,
    [
      establishmentId,
      administrator.nombres,
      administrator.apellidos,
      administrator.correo,
      passwordHash,
      administrator.telefono,
    ],
  );
  return result.rows[0];
}

async function assignAdministratorRole(client, userId) {
  const result = await client.query(
    `INSERT INTO usuario_roles (usuario_id, rol_id)
     SELECT $1, id FROM roles WHERE codigo = 'administrador'
     RETURNING rol_id`,
    [userId],
  );
  if (result.rowCount !== 1) {
    throw new Error('The administrator role was not seeded in the database.');
  }
}

module.exports = {
  assignAdministratorRole,
  createAdministrator,
  createCompany,
  createEstablishment,
};
