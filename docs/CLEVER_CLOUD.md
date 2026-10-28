# Desplegar ELITECORE en Clever Cloud

Este repositorio en la rama `main` contiene la **versión estática** usada por GitHub Pages. No es todavía la versión PHP/MySQL de ELITECORE: para desplegar cuentas, el panel de administración y la API se necesitan los archivos PHP de la edición para Clever Cloud.

## Configuración necesaria

1. En [Clever Cloud Console](https://console.clever-cloud.com/) crea una aplicación **PHP with Apache**, vinculada a un repositorio que incluya la edición PHP del proyecto (`public/`, `public/api/` y `database/`).
2. Selecciona la rama del repositorio que realmente contenga la edición PHP.
3. En variables de entorno configura `CC_WEBROOT=/public`, para servir `public/index.html`.
4. Crea un add-on **MySQL DEV** y **vincúlalo** a la aplicación. Clever Cloud proporciona `MYSQL_ADDON_HOST`, `MYSQL_ADDON_PORT`, `MYSQL_ADDON_DB`, `MYSQL_ADDON_USER` y `MYSQL_ADDON_PASSWORD`.
5. Configura un nuevo `JWT_SECRET` de 32 o más caracteres **solo en las variables privadas de Clever Cloud**.
6. Importa el SQL del catálogo en una base *vacía*. Si necesitas recuperar tus usuarios o sus registros, restaura antes tu respaldo de la base original (no sobrescribas una base con datos).
7. Verifica `/api/catalog.php`, `/api/auth.php?action=me` y una prueba de registro/inicio de sesión.

**Aviso:** la base MySQL gratuita de InfinityFree no permite conexiones desde Clever Cloud. Tendrás que migrarla a una base accesible desde Clever Cloud. El add-on MySQL DEV es para pruebas; el alojamiento PHP puede generar costes. No publiques `api/config.php` con credenciales, contraseñas ni JWT secretos.

Documentación: [PHP en Clever Cloud](https://www.clever-cloud.com/developers/doc/applications/php/) · [MySQL](https://www.clever-cloud.com/developers/doc/addons/mysql/).

Este archivo es una guía, **no demuestra que la aplicación esté desplegada en Clever Cloud**.
