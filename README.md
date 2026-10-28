# ELITECORE

Elige un objetivo, sigue una sesión guiada y organiza tus comidas. La página incluye contenido desde el primer acceso: 12 ejercicios, 3 planes generales y 6 recetas. Funciona en celular y computadora sin instalar dependencias.

## Publicar gratis en GitHub Pages

Este repositorio incluye la publicacion automatica de la version **estatica** de ELITECORE. En **Settings → Pages → Build and deployment → Source**, selecciona **GitHub Actions**. Los cambios en `main` se publicaran mediante `.github/workflows/pages.yml`.

Direccion prevista (activa una vez que GitHub confirme el despliegue): https://bydayland14.github.io/Gestion-y-emprendimiento/

Esta edicion de GitHub Pages permite consultar y guardar registros **en el navegador**. GitHub Pages no ejecuta PHP ni MySQL, por lo que las funciones de la version PHP de InfinityFree (inicio de sesion, administrador y base de datos MySQL) necesitan seguir alojadas en InfinityFree. No publiques `api/config.php`, contraseñas de MySQL ni secretos JWT aqui.

## Usarla

1. En **Inicio**, elige Fuerza en casa, Más resistencia o Moverme con constancia y una duración de 10, 20 o 30 minutos.
2. Entra a tu sesión: verás movimientos, imágenes, tiempo de actividad, descansos y pausas. Al terminar, confirma los minutos que realizaste y el esfuerzo; el entrenamiento se registra automáticamente.
3. En **Mi plan**, consulta doce sesiones en cuatro semanas, pausa o cambia tu objetivo. Cambiar de plan conserva los entrenamientos anteriores.
4. En **Comidas**, consulta recetas, filtra vegetarianas o ingredientes, añade comidas a tu semana y obtén una lista de compras ajustada al número de personas. Puedes marcar lo comprado y descargar la lista.
5. En **Mi progreso**, consulta las sesiones y minutos confirmados. Los registros manuales, descanso, competencias, perfil e informe siguen disponibles en Más herramientas.

Los planes son propuestas generales de actividad para adultos, no una planificación individual de alto rendimiento ni un tratamiento. No se aumentan automáticamente las cargas. Las recetas son ideas de comida propias; no se calculan calorías ni se presenta una dieta médica.

## Abrir en Visual Studio Code

Descomprime el ZIP, abre la carpeta y utiliza **Live Server** sobre `index.html`. También puedes ejecutar `python3 -m http.server 8080` (Windows: `py -m http.server 8080`). Usa un servidor HTTP, no abras la página como un archivo local: el catálogo y los módulos se cargan mediante HTTP.

`npm start` es una alternativa si tienes Node y Python. No se necesita ejecutar `npm install`, compilar ni contratar servicios para utilizar el catálogo y guardar el avance en el navegador.

## Base de datos y cuentas

- `data/catalog.json` alimenta el contenido público de la web estática.
- `database/catalog.db` es una base SQLite real del mismo catálogo: 12 ejercicios, 6 recetas y 3 planes.
- `database/supabase.sql` crea las tablas privadas por cuenta y los catálogos públicos con políticas RLS.
- `database/seed_catalog.sql` carga el contenido en Supabase sin duplicar IDs.
- `python3 database/build_catalog.py` regenera SQLite y el seed desde JSON.

Sin una cuenta configurada, los registros y planes personales se guardan en localStorage de este navegador; un entrenamiento en curso usa sessionStorage de la pestaña. Exporta una copia desde Mi perfil antes de borrar los datos del navegador. GitHub Pages no ejecuta un servidor de base de datos.

Para activar cuentas y sincronización hace falta un proyecto Supabase del propietario. Con la URL y clave pública en `js/config.js`, la web intentará leer los catálogos públicos y conservará el catálogo incluido si el servidor no responde o está vacío. Los registros privados se sincronizan con la fila autenticada del usuario. Una cuenta sin configurar no se simula como activa.

Consulta [BASE_DE_DATOS.md](docs/BASE_DE_DATOS.md) y [PUBLICAR.md](docs/PUBLICAR.md). Nunca publiques claves secretas, `service_role` ni la contraseña de la base de datos.

## Contenido y procedencia

Las 16 fotografías de ocho movimientos proceden de Free Exercise DB y conservan su licencia Unlicense en `assets/exercises/LICENSE.txt`. Los textos españoles son adaptaciones propias. Otros cuatro movimientos básicos no utilizan fotografía externa. Las recetas y los circuitos son originales de ELITECORE. Las ilustraciones de recetas son dibujos, no fotografías del plato.

Se estudiaron patrones documentados de wger y Tandoor, sin copiar su código ni sus recetas. La investigación, las URLs fijadas a una versión y las sumas SHA-256 están en [INVESTIGACION.md](docs/INVESTIGACION.md) y `data/sources.json`. No se afirma validación clínica, nutricional ni una asociación con esas aplicaciones.

## Organización del proyecto

```text
index.html, css/         Interfaz adaptable
js/app.js, js/ux.mjs     Navegación, datos personales y formularios
js/experience.mjs       Objetivos, sesión guiada, recetas y compras
js/plan-engine.mjs      Calendario, finalización y cálculo de ingredientes
js/catalog.mjs          Catálogo local y lectura pública opcional de Supabase
js/analysis.mjs         Comparaciones de registros deportivos
js/config.js            Solo URL y clave pública de Supabase
assets/exercises/       Fotografías locales y licencia
 data/                  Catálogo público y procedencia
 database/              SQLite, SQL y generador
 docs/                  Publicación, bases, investigación y validación
 tests/                 Pruebas de reglas y recorridos de navegador
```

## Comprobaciones

- `npm test`: 25 pruebas de reglas, catálogo, temporizadores, finalización y compras.
- `npm run check`: sintaxis de los módulos JavaScript.
- `python3 database/test_build_catalog.py`: seis pruebas del generador.
- Pruebas opcionales de navegador: instala Playwright con `python -m pip install playwright` y `python -m playwright install chromium`; ejecuta `python tests/experience_browser.py`, `python tests/ux_browser.py` y `python tests/ux_guards.py`. Usan servidores locales temporales y guardan capturas en `test-results/`. Las pruebas de servicio externo usan respuestas simuladas.

Los resultados y sus límites se detallan en [VALIDACION.md](docs/VALIDACION.md). No se han realizado pruebas con participantes, configurado un proyecto Supabase real ni publicado aplicaciones nativas en las tiendas Android/iOS. No hay conexión automática con relojes, chips, pagos ni acceso remoto de entrenadores.
