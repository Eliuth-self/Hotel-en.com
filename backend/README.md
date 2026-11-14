# Backend de Hospedado

API REST con Express y PostgreSQL (Neon). Implementa empresas, establecimientos,
usuarios, roles, autenticación y gestión básica de habitaciones con tarifas.
La geografía queda preparada en el esquema; la carga de DIVIPOLA y sus endpoints
corresponden a una fase posterior.

El código se organiza por módulo en `src/modules/`: las rutas conectan con
controladores, los controladores validan y delegan en servicios, y los modelos
concentran las consultas PostgreSQL. La configuración, middleware, transacciones
y migraciones se mantienen en carpetas separadas.

## Requisitos

- Node.js 20 o posterior.
- Una base PostgreSQL, por ejemplo una base Neon.

## Configuración

1. Copia `.env.example` a `.env`.
2. Reemplaza `DATABASE_URL` por la cadena de conexión PostgreSQL de Neon. Mantén
   TLS habilitado (`sslmode=require`) y no publiques ese valor.
3. Genera un valor aleatorio de al menos 32 caracteres para `JWT_SECRET`.
4. Instala dependencias con `npm install`.
5. Crea el esquema ejecutando `npm run db:migrate`.
6. Inicia en desarrollo con `npm run dev`, o con `npm start`.

La aplicación no crea tablas automáticamente al arrancar. Las migraciones son
explícitas y se registran en `schema_migrations`. El endpoint `GET /health`
comprueba la conexión a la base de datos.

## Rutas implementadas

Todas las rutas están bajo `/api`.

| Método | Ruta | Acceso |
| --- | --- | --- |
| POST | `/onboarding` | Público: crea empresa, establecimiento y administrador inicial |
| POST | `/auth/login` | Público |
| POST | `/auth/logout` | Sesión activa |
| GET | `/auth/me` | Sesión activa |
| GET | `/public/establecimientos?q=...` | Público: búsqueda por nombre o ubicación |
| GET | `/public/establecimientos/:id` | Público: detalle de un hotel y habitaciones disponibles |
| GET, PUT | `/empresa` | Sesión; modificación solo administrador |
| GET, PUT | `/establecimiento` | Sesión; modificación solo administrador |
| GET, POST | `/usuarios` | Administrador |
| GET, PUT, DELETE | `/usuarios/:id` | Administrador |
| GET | `/roles` | Administrador |
| GET | `/habitaciones` | Sesión activa |
| GET | `/habitaciones/resumen` | Sesión activa |
| GET | `/habitaciones/:id` | Sesión activa |
| POST, PUT, DELETE | `/habitaciones` y `/habitaciones/:id` | Administrador |
| GET | `/habitaciones/grupos` | Sesión activa |
| POST, PUT, DELETE | `/habitaciones/grupos` y `/habitaciones/grupos/:id` | Administrador |
| POST | `/habitaciones/grupos/:id/habitaciones` | Administrador |

El inicio de sesión acepta `{ "correo": "...", "password": "..." }`. Las
contraseñas tienen mínimo 10 caracteres y se almacenan con bcrypt. El logout
revoca la sesión en PostgreSQL. Las solicitudes autenticadas envían
`Authorization: Bearer <token>`.

El onboarding recibe un objeto con `empresa`, `establecimiento` y
`administrador`. El alta de empresa, establecimiento, administrador, rol y
sesión ocurre en una única transacción. Cada usuario y consulta privada se
limitan al establecimiento obtenido de la sesión, no a un identificador enviado
por el cliente.

Ejemplo mínimo de registro:

```json
{
  "empresa": {
    "razon_social": "Hotel Ejemplo SAS",
    "tipo_documento": "NIT",
    "numero_documento": "900123456",
    "correo_contacto": "contacto@example.com"
  },
  "establecimiento": {
    "nombre_comercial": "Hotel Ejemplo",
    "tipo_establecimiento": "hotel"
  },
  "administrador": {
    "nombres": "Ana",
    "apellidos": "Pérez",
    "correo": "ana@example.com",
    "password": "una-clave-segura-123"
  }
}
```

Los roles iniciales son `administrador`, `recepcionista`, `cajero`,
`inventario`, `limpieza` y `supervisor`. En esta fase las operaciones de gestión
de usuarios y cambios de configuración requieren `administrador`; los permisos
funcionales restantes se asignarán a medida que se implementen sus módulos.

## Habitaciones

Las habitaciones pertenecen al establecimiento del usuario autenticado. Cada
una tiene un código o número único dentro del establecimiento, ubicación,
estado, indicador de minibar, reseña, lista de elementos del cuarto y una o más
tarifas. Cada tarifa admite una modalidad y duración opcional en minutos; la
moneda predeterminada es COP.

Estados permitidos: `disponible`, `ocupada`, `mantenimiento`, `limpieza` e
`inactiva`. El estado disponible es manual por ahora: como aún no existen
reservas ni calendario, no representa disponibilidad calculada por fechas.
`DELETE` desactiva la habitación cambiando su estado a `inactiva`.

Ejecuta `npm run db:migrate` después de actualizar para crear las tablas de
habitaciones y tarifas.

### Catálogo público

`GET /api/public/establecimientos` devuelve hasta 100 establecimientos activos
que tienen `visible_publicamente = TRUE`. El parámetro opcional `q` busca por
nombre comercial, municipio, división territorial o dirección. La respuesta
incluye el conteo de habitaciones por estado, pero omite las habitaciones
inactivas.

`GET /api/public/establecimientos/:id` devuelve el perfil público y una lista
resumida de las habitaciones marcadas actualmente como disponibles. Por
privacidad no incluye el número o código de habitación. Los endpoints no crean
reservas ni garantizan disponibilidad para fechas futuras.

Ejemplo para crear una habitación:

```http
POST /api/habitaciones
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "numero": "101",
  "ubicacion": "Piso 1, ala norte",
  "estado": "disponible",
  "minibar": true,
  "resena": "Habitación con vista al jardín.",
  "contenido": ["Cama doble", "Televisor", "Aire acondicionado", "Baño privado"],
  "tarifas": [
    {
      "modalidad": "Por horas",
      "duracion_minutos": 180,
      "precio": 80000,
      "moneda": "COP"
    },
    {
      "modalidad": "Noche",
      "duracion_minutos": 720,
      "precio": 180000,
      "moneda": "COP"
    }
  ]
}
```

`GET /api/habitaciones` lista las habitaciones del establecimiento y sus tarifas.
`GET /api/habitaciones/resumen` devuelve el conteo total por estado. Para cambiar
precios, envía `tarifas` a `PUT /api/habitaciones/:id`; esa lista reemplaza las
tarifas existentes de la habitación.

### Grupos reutilizables de habitaciones

Un administrador puede guardar grupos con ubicación, minibar, descripción,
contenido y tarifas comunes. Los grupos son plantillas: actualizar o eliminar
una plantilla no cambia las habitaciones que ya se crearon con ella. Para crear
habitaciones en lote, envía entre 1 y 500 números; todas se crean disponibles y
la operación completa falla si algún número ya existe.

```http
POST /api/habitaciones/grupos
Authorization: ******
Content-Type: application/json
```

```json
{
  "nombre": "Estándar",
  "ubicacion": "Piso 1",
  "minibar": false,
  "contenido": ["Cama doble", "Televisor", "Baño privado"],
  "tarifas": [
    { "modalidad": "Noche", "precio": 180000, "moneda": "COP" }
  ]
}
```

Luego usa `POST /api/habitaciones/grupos/:id/habitaciones` con
`{ "numeros": ["101", "102", "103"] }`. La migración `003_room_groups.sql`
crea las tablas de plantillas y sus tarifas.

## Inventario, estadías, ventas y caja

Después de actualizar el código, aplica la migración nueva desde `backend` con
`npm run db:migrate`. La migración `004_hotel_operations.sql` crea productos,
ubicaciones y existencias, movimientos de inventario, huéspedes, estadías,
cargos, pagos, ventas y cierres de caja.

Un administrador o usuario de inventario crea productos con categoría
`minibar`, `tienda` o `general`, costo, precio de venta y stock mínimo. Crea
después ubicaciones de tipo `bodega` y `tienda`; cada ubicación `minibar` debe
vincularse a una habitación que tenga minibar activado. El stock se ingresa,
ajusta o traslada entre ubicaciones, y cada operación queda registrada con el
usuario y la fecha. El sistema rechaza las ventas y consumos que excedan las
existencias.

Recepción inicia una estadía presencial con `POST /api/operaciones/estadias`,
indicando una habitación disponible y los datos del huésped. La habitación
debe tener una tarifa `Noche` en COP; esa tarifa queda guardada como valor de
la estadía para que cambios posteriores de precio no alteren la cuenta. Las
reservas futuras no están incluidas en esta primera versión.

Los consumos de minibar y las compras de tienda se cargan a la estadía mediante
`POST /api/operaciones/estadias/:id/cargos`; descuentan stock y se cobran al
cierre. `POST /api/operaciones/estadias/:id/cierre` agrega el alojamiento por
noches calendario (mínimo una noche), registra un único pago completo en
efectivo, tarjeta o transferencia, cierra la estadía y marca la habitación
disponible. Las ventas directas de tienda se registran con
`POST /api/operaciones/ventas` y se cobran en el momento.

`GET /api/operaciones/ingresos?desde=AAAA-MM-DD&hasta=AAAA-MM-DD` informa lo
cobrado en el rango, separado por alojamiento, minibar y tienda. El cierre
personal de caja suma los pagos recibidos por el usuario desde su cierre
anterior; `GET /api/operaciones/caja/actual` muestra el total esperado por
medio de pago y `POST /api/operaciones/caja/cierre` guarda el efectivo contado
y la diferencia. Cada check-in, consumo, venta, pago, ajuste y cierre se
mantiene aislado por establecimiento.
