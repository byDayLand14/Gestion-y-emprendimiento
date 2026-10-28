# Publicar ELITECORE

## Opción 1: GitHub Pages gratuito (sitio estático, sin PHP ni MySQL)

1. En GitHub abre tu repositorio `Gestion-y-emprendimiento`.
2. El codigo del sitio estatico ya esta en la rama `main`. El flujo de publicacion automatica esta en `.github/workflows/pages.yml`.
3. En **Settings → Pages → Build and deployment → Source**, selecciona **GitHub Actions**. La publicacion se inicia desde la pestaña **Actions** al actualizar `main`.
4. Cuando GitHub confirme la publicacion, abre `https://bydayland14.github.io/Gestion-y-emprendimiento/`. Las rutas con `#` permiten navegar sin configuración adicional del servidor.
5. Comprueba en un celular que puedes guardar un entrenamiento, recargar la página y verlo de nuevo.

Este modo guarda los datos en cada navegador. No permite compartir registros entre dispositivos automáticamente. No ejecuta el backend PHP que usa InfinityFree para cuentas, administrador y MySQL. Todo el contenido del repositorio público será visible: no subas datos personales ni secretos.

## Opción 2: añadir cuentas y base de datos con Supabase

1. Crea una cuenta en **https://supabase.com** y un proyecto en el plan gratuito disponible. Guarda la contraseña de la base de datos en tu gestor de contraseñas; no se usa en el frontend.
2. En **SQL Editor**, ejecuta el contenido completo de `database/supabase.sql`. Activa las políticas de seguridad incluidas; no desactives RLS. El script puede repetirse: actualiza sus políticas y su trigger sin borrar los registros. Ejecuta también `database/seed_catalog.sql` si deseas servir el catálogo desde Supabase.
3. Busca la URL del proyecto y la clave pública `anon` (legacy) o publishable en **Project Settings → API / API Keys**, según la interfaz vigente.
4. Edita `js/config.js`:

```js
window.ELITECORE_CONFIG = {
  supabaseUrl: 'https://TU-PROYECTO.supabase.co',
  supabaseAnonKey: 'TU-CLAVE-PUBLICA'
};
```

La clave pública puede estar en la web porque los permisos se aplican con RLS. Nunca uses `service_role`, una clave secreta, la contraseña de la base ni tokens personales.

5. En **Authentication → Providers**, habilita Email. En **URL Configuration**, configura Site URL con la dirección HTTPS de tu web y añade esa misma dirección a los destinos de redirección permitidos. Mantén la confirmación por correo activada. Para uso público configura SMTP propio; el envío por defecto tiene restricciones. No hace falta un proveedor de pago para usar la aplicación local.
6. Publica de nuevo `js/config.js` en tu hosting. Abre la web, pulsa **Conectar mi cuenta**, crea una cuenta y confirma el correo. Luego inicia sesión.
7. Si la cuenta está vacía, la aplicación te pregunta si quieres subir los registros locales. Si la cuenta ya tiene registros, carga los de la cuenta.
8. Guarda una sesión deportiva. Cierra sesión y entra desde otro navegador. Comprueba que se recupera. Usa dos cuentas diferentes para verificar que no ven los registros de la otra.
9. Para borrar registros, usa **Mi perfil → Eliminar mis datos** mientras la cuenta esté conectada. Esto vacía el espacio de registros; no elimina la identidad de autenticación. Si alguien solicita borrar su cuenta completa, el responsable debe eliminar ese usuario en Supabase Authentication; la tabla elimina sus registros en cascada.

La aplicación no instala ni configura Supabase por sí misma. La conexión real requiere que completes estos pasos. Si la sesión expira, vuelve a iniciar sesión antes de sincronizar. Exporta una copia antes de cambiar de cuenta; evita cuentas compartidas y no mantengas datos sensibles en navegadores públicos.

## Alternativa de alojamiento

Cloudflare Pages permite desplegar archivos estáticos mediante carga directa o integración con GitHub. Sube la carpeta que contiene `index.html`; no necesitas comando de compilación. Configura el dominio HTTPS resultante en Supabase si usas cuentas. Consulta los límites y condiciones vigentes de cada proveedor: el alojamiento gratuito no garantiza disponibilidad indefinida ni incluye necesariamente dominio propio.

## Qué requiere trabajo adicional

Las integraciones automáticas con Garmin, Strava, chips o cronometraje necesitan APIs, consentimiento y credenciales del proveedor. Un directorio real necesita profesionales y un proceso de verificación. Pagos, planes comerciales, acceso remoto de entrenadores, recuperación de contraseña desde una pantalla propia y notificaciones requieren desarrollo adicional. No se anuncian como servicios activos.

## Catálogo y nueva experiencia

La página ya incluye planes, movimientos e ideas de comidas sin una cuenta. Publica también las carpetas `data/` y `assets/`; si faltan, los planes o las imágenes no cargarán. No necesitas un comando de compilación. Consulta `BASE_DE_DATOS.md` para la base SQLite incluida y para los catálogos públicos de Supabase. Los archivos SQL no crean por sí mismos una cuenta externa.
