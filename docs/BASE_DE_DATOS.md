# Qué base de datos incluye ELITECORE

ELITECORE separa el contenido que cualquiera puede consultar —ejercicios, recetas y planes— de la información privada de cada deportista.

| Archivo o servicio | Qué contiene | Qué permite |
| --- | --- | --- |
| `data/catalog.json` | Contenido público y sus fuentes | La web puede mostrarlo desde GitHub Pages sin crear cuentas ni contratar un servidor. |
| `database/catalog.db` | La misma información en una base SQLite | Consultar y administrar el catálogo desde herramientas de bases de datos; no sincroniza usuarios por sí sola. |
| Supabase, tras configurarlo | Catálogos públicos y registros privados por cuenta | Autenticación y sincronización entre dispositivos. Requiere un proyecto externo del propietario. |

GitHub Pages aloja archivos estáticos: no ejecuta una base de datos de usuarios. La base SQLite incluida es un archivo real de catálogo, pero no es un servidor ni permite a dos dispositivos compartir registros automáticamente. La web carga primero el catálogo JSON. Si configuras Supabase, intenta leer sus tres catálogos públicos; conserva la copia incluida si están vacíos, son inválidos o no responden. Sin una cuenta conectada, tus registros privados permanecen en el navegador.

## Preparar o actualizar el catálogo

Desde la carpeta principal del proyecto:

```sh
python3 database/build_catalog.py
```

En Windows puedes usar `py database/build_catalog.py`. El script no necesita paquetes adicionales. Lee `data/catalog.json` y genera:

- `database/catalog.db`, con las tablas `exercise_catalog`, `recipe_catalog` y `plan_catalog`.
- `database/seed_catalog.sql`, para cargar o actualizar ese contenido en Supabase.

Cada entrada debe tener `id` y `name` de texto no vacío. Los demás campos se conservan completos en `payload`: instrucciones, ingredientes, material, fuentes y otros metadatos. Se rechazan identificadores duplicados, JSON inválido, caracteres incompatibles, referencias a ejercicios inexistentes y rutas de fotos locales ausentes o fuera del proyecto. No se comprueba la disponibilidad de imágenes remotas. La generación no lee cuentas ni contraseñas.

Puedes abrir `catalog.db` con DB Browser for SQLite o una extensión SQLite de Visual Studio Code. Por ejemplo:

```sql
select id, name from exercise_catalog;
select id, name from recipe_catalog;
select id, name from plan_catalog;
```

Editar SQLite no cambia automáticamente la web. Edita primero el catálogo JSON y vuelve a generar las bases para mantener las copias coherentes.

## Activar la base en línea

1. Crea tu proyecto en [Supabase](https://supabase.com). Guarda las credenciales administrativas en tu gestor de contraseñas; no las envíes por chat ni las subas a GitHub.
2. En **SQL Editor**, ejecuta el archivo completo `database/supabase.sql`. Puedes volver a ejecutarlo: actualiza las políticas y el trigger conocidos sin borrar registros existentes.
3. Ejecuta `database/seed_catalog.sql`. Puede repetirse: actualiza por `id`, no borra contenido adicional ni registros privados.
4. En los ajustes API del proyecto, copia la URL y la clave pública `anon` o publishable. Pon únicamente esos valores públicos en `js/config.js`, en `supabaseUrl` y `supabaseAnonKey`. Nunca uses `service_role`, claves secretas ni la contraseña de la base de datos en la web.
5. Habilita Email en Authentication, configura la URL HTTPS de tu página como Site URL y destino permitido, y mantén la confirmación por correo. Sigue los detalles de [PUBLICAR.md](PUBLICAR.md).
6. Publica el cambio de configuración. Crea una cuenta desde la aplicación, confirma el correo, entra y guarda un entrenamiento. Entra desde otro navegador y comprueba que se recupera.
7. Haz la prueba con una segunda cuenta: no debe ver los registros de la primera.

La creación del archivo SQL y de SQLite no significa que se haya creado un proyecto Supabase. Se debe afirmar que la sincronización está activa solo después de configurar y probar ese proyecto real. El contenido público sigue disponible sin hacerlo.

## Permisos incluidos

- `athlete_data`: cada cuenta autenticada solo puede leer o cambiar la fila cuyo `user_id` coincide con `auth.uid()`. Las personas sin sesión no pueden leer registros privados.
- `exercise_catalog`, `recipe_catalog`, `plan_catalog`: lectura pública mediante políticas RLS. La web no puede insertar, editar o borrar esos catálogos.
- Las actualizaciones editoriales se realizan mediante el SQL del propietario, no desde una clave administrativa expuesta al navegador.

El catálogo no contiene información personal. Las tablas privadas conservan el formato de registros que ya utiliza la aplicación, por lo que este cambio no exige borrar ni reiniciar los datos existentes. Antes de modificar una base usada por personas reales, conserva las copias de seguridad adecuadas.

## Verificación

La generación comprueba la integridad del archivo SQLite. Ejecuta `python3 database/test_build_catalog.py` para las seis pruebas del generador. El catálogo incluido se ha comprobado con 12 ejercicios, 6 recetas, 3 planes, 9 circuitos definidos para las sesiones, 36 referencias válidas de ejercicios y 16 imágenes locales presentes. Los planes son ejemplos generales de actividad, no planes validados profesionalmente. Las comprobaciones locales del generador y del SQL no prueban la entrega de correos, la disponibilidad de un servicio Supabase ni el aislamiento en un servidor remoto. Las pruebas con dos cuentas del paso anterior son necesarias para verificar la configuración publicada.
