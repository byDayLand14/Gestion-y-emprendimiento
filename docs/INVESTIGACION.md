# Investigación de contenido y referencias de producto

Consulta: 27 de octubre de 2026. Se leyeron archivos públicos de los repositorios mediante HTTPS. Se revisó documentación de las aplicaciones, no una sesión autenticada ni una prueba de sus servicios en producción.

## Qué se puede aprender de productos existentes

| Referencia consultada | Evidencia en su documentación | Aplicación práctica para ELITECORE |
| --- | --- | --- |
| [wger](https://github.com/wger-project/wger/blob/master/README.md) | Presenta «Custom Workout Routines», reglas de progresión, seguimiento y una biblioteca de ejercicios. | Empezar por un objetivo y ofrecer una sesión concreta con ejercicios que se puedan completar. Los registros deben surgir al terminar la sesión, sin pedir al usuario que redacte todo de nuevo. |
| [Free Exercise DB](https://github.com/yuhonas/free-exercise-db) | Publica un catálogo con imágenes, instrucciones, nivel, equipo y músculos, acompañado de una interfaz de búsqueda. | Permitir explorar ejercicios antes de tener registros; mostrar cómo se ejecuta cada movimiento y qué material necesita. Filtrar por equipo y nivel ayuda a elegir. |
| [Tandoor Recipes](https://github.com/TandoorRecipes/recipes/blob/develop/README.md) | Sus funciones principales incluyen recetas, planificación de varias comidas al día y listas de compras desde el plan o desde las recetas. | Convertir una receta elegida en una tarea útil: prepararla o añadir sus ingredientes a una lista de compras. Una lista de alimentos consumidos no reemplaza esta ayuda. |
| [Open Food Facts](https://github.com/openfoodfacts/openfoodfacts-server/blob/main/docs/api/index.md) | Proporciona ingredientes, alérgenos y valores de productos envasados; advierte sobre datos aportados por usuarios y potencialmente incompletos. | Una futura búsqueda de productos puede evitar escribir etiquetas a mano. Requiere mostrar procedencia y datos ausentes. No equivale a una dieta individual ni a una evaluación nutricional. |

Los patrones anteriores ya existen en otros productos. La utilidad de ELITECORE debe justificarse por un recorrido claro y por reunir un objetivo, sesiones realizables, ideas de comidas y el avance conseguido. No se afirma que estos patrones constituyan una invención ni que la experiencia haya sido validada con deportistas.

## Ejercicios incorporables y procedencia

Fuente: [Free Exercise DB](https://github.com/yuhonas/free-exercise-db), versión `f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5`.

Se descargó su archivo combinado y se verificaron **876 ejercicios**. El README describe los datos como «Open Public Domain Exercise Dataset» y explica que JSON e imágenes se pueden usar localmente. El archivo [LICENSE.md](https://github.com/yuhonas/free-exercise-db/blob/f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5/LICENSE.md) contiene **Unlicense**, una dedicación al dominio público. La procedencia anterior indicada en el README es `wrkout/exercises.json`.

Se descargaron sin editar dos imágenes JPEG de cada uno de estos ocho ejercicios:

| Identificador de la fuente | Nombre usado para adaptación al español |
| --- | --- |
| `Bodyweight_Squat` | Sentadilla sin peso |
| `Pushups` | Flexión de brazos |
| `Plank` | Plancha frontal |
| `Butt_Lift_Bridge` | Puente de glúteos |
| `Dead_Bug` | Extensión alterna en el suelo |
| `Side_Leg_Raises` | Elevación lateral de pierna |
| `Standing_Hip_Circles` | Círculos de cadera de pie |
| `Front_Leg_Raises` | Elevación frontal de pierna |

Las 16 imágenes se conservan en `assets/exercises/<identificador>/0.jpg` y `1.jpg`; ocupan 706 570 bytes en total. Su decodificación JPEG se verificó. La licencia original se conserva en `assets/exercises/LICENSE.txt`. Las URLs exactas, dimensiones y sumas SHA-256 están en `data/sources.json`.

La licencia declarada es global del repositorio; las fotografías no incluyen fichas individuales con fotógrafo o licencia independiente. Esto se documenta para mantener trazabilidad. No se reutilizó el favicon del proyecto ni sus elementos visuales de terceros.

Los nombres y explicaciones en español de ELITECORE pueden ser adaptaciones propias. Debe distinguirse una descripción de movimiento de un programa individualizado. La fuente no demuestra revisión clínica ni permite inferir que un ejercicio es adecuado para todas las personas. Por ejemplo, la categoría `body only` no garantiza que no se necesite una superficie: algunas variantes de flexiones del catálogo usan banco o apoyo.

## Alimentación: qué reutilizar y qué evitar

Las recetas de ELITECORE se redactarán como contenido propio con ingredientes y pasos explícitos. Consultar el patrón de Tandoor no concede una licencia general sobre recetas de sitios que esa aplicación importa. No se copiaron sus textos de recetas, imágenes ni código.

No se han obtenido ni calculado valores nutricionales verificados de estas recetas. No deben presentarse calorías, macronutrientes, déficits o propiedades deportivas como si procedieran de una base validada. Conviene mostrar ingredientes y alérgenos conocidos y permitir elegir según disponibilidad y preferencias, sin convertir estas opciones en una prescripción de dieta.

Open Food Facts no se incorporó como una base de datos local de ELITECORE. Su documentación indica:

- Base de datos: **ODbL**; contenido individual: **DbCL**; fotografías de productos: **CC BY-SA 3.0**.
- Datos aportados de forma voluntaria; no se garantizan exactitud, integridad o fiabilidad.
- La API tiene límites de solicitudes y solicita identificación de la aplicación mediante un User-Agent específico.

Una integración futura debe comprobar sus términos vigentes y el funcionamiento del servicio. No basta con publicar su URL ni con reutilizar la licencia AGPL del servidor: las condiciones de los datos son diferentes.

## Fuentes oficiales externas que no se pudieron leer

Se intentaron estas páginas:

- [NHS — Couch to 5K](https://www.nhs.uk/live-well/exercise/get-running-with-couch-to-5k/).
- [OMS — Healthy diet](https://www.who.int/news-room/fact-sheets/detail/healthy-diet).

El proxy del entorno rechazó ambas conexiones con **403 Forbidden**. Por tanto, no se atribuyen programas, cantidades, recetas ni recomendaciones a estas páginas como si se hubieran consultado. No se eludió la política de red.

## Licencias del software de referencia

- **wger:** AGPL-3.0-or-later para el código; datos de ejercicios e ingredientes con licencias Creative Commons de cada entrada; documentación CC-BY-SA-4.0. Se estudiaron sus funciones y no se incorporó su código.
- **Tandoor:** su README declara AGPL v3 con una excepción de venta Commons Clause. Se utilizó como referencia de interacción, sin copiar código ni contenido de recetas.
- **Free Exercise DB:** Unlicense; es la fuente de las imágenes descargadas y de los identificadores trazables del catálogo.

La investigación y el catálogo local no crean una cuenta, un servidor remoto, una base compartida ni una validación profesional. Esas capacidades deben comprobarse por separado antes de anunciarlas como activas.
