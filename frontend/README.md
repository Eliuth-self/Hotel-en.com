# Hotel En.com — frontend

Frontend en React, TypeScript y Vite para explorar hoteles y administrar el
perfil y las habitaciones de un establecimiento.

## Ejecutar localmente

1. Configura el backend siguiendo `../backend/README.md` y asegúrate de que esté
   escuchando en `http://127.0.0.1:3000`.
2. Desde esta carpeta, instala dependencias e inicia Vite:

   ```powershell
   npm install
   npm run dev
   ```

3. Abre `http://127.0.0.1:5173`. Vite reenvía las solicitudes `/api` al backend.

Si el backend está en otra URL, crea un archivo `.env.local` con
`VITE_API_URL=https://tu-api.example/api` y reinicia Vite. No incluyas secretos
en variables `VITE_*`, porque se incorporan al código del navegador.

## Estructura

- `src/components/`: componentes reutilizables y componentes administrativos.
- `src/pages/`: inicio, búsqueda, detalle del hotel, registro, inicio de sesión
  y panel del establecimiento.
- `src/hooks/`: navegación, sesión y notificaciones.
- `src/services/api.ts`: cliente HTTP, autenticación y adaptación de respuestas.
- `src/types/`: tipos del dominio.
- `src/utils/`: búsqueda local, enlaces de Maps y validación de lotes.
- `src/styles.css`: estilos responsive.
- `test/`: pruebas de utilidades.

## Integración y alcance

El catálogo público consulta los establecimientos activos con visibilidad
pública habilitada. La búsqueda funciona por nombre y texto de ubicación. El
detalle muestra disponibilidad actual sin revelar números de habitación. Los
administradores pueden registrarse o iniciar sesión para editar el perfil,
controlar la visibilidad, cambiar estados y crear habitaciones individuales o
por grupo. La sesión se conserva en `localStorage` mediante el token de la API.

Hotel En.com no procesa reservas ni pagos. Los estados de habitación son
informativos y corresponden al último dato consultado; no hay sincronización
en tiempo real ni garantía de disponibilidad futura.

Para validar la aplicación ejecuta `npm run build` y `npm test`.
