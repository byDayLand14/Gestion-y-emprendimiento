# Validación realizada

Pruebas ejecutadas en Chromium mediante Playwright sobre un servidor HTTP local:

- Creación y persistencia de entrenamiento tras recargar.
- Edición de una sesión existente sin duplicar el registro.
- Registro de alimentos y descanso.
- Guardado del perfil y actualización del saludo.
- Importación de dos resultados CSV y rechazo de una fecha inexistente sin insertar datos parciales.
- Comparación de resultados con disciplina y distancia coincidentes.
- Descarga de informe, autorización y revocación.
- Exportación JSON y eliminación de un entrenamiento.
- Diseño de escritorio y de celular a 390 píxeles sin desbordamiento horizontal de la página.
- Ausencia de errores JavaScript durante los recorridos.
- Autenticación, carga de registros, escritura, respuesta HTTP 201 sin contenido y limpieza local al cerrar sesión, usando respuestas controladas de API.

Comprobación estática: `node --check js/app.js`.

Las pruebas de API con respuestas controladas verifican el comportamiento del cliente; no prueban un proyecto Supabase real, entrega de correos ni aislamiento efectivo en un servidor desplegado. El SQL y las instrucciones se incluyen para que el propietario configure y compruebe esos servicios. No se ha publicado el sitio en ningún hosting ni se han creado cuentas externas.

Para comprobarlo manualmente: abre con Live Server, completa el perfil, registra una sesión, edítala, recarga, añade descanso y alimentación, importa dos resultados de la misma distancia y disciplina, revisa la comparación y exporta tus datos. Comprueba que el informe de entrenador requiere autorización y que deja de estar disponible al retirarla. Para la conexión real y la prueba con dos cuentas, sigue PUBLICAR.md.

## Validación de tiempos y claridad de uso

Comprobado en Chromium: minutos de sueño entre 0 y 59; conversión de registros anteriores (1,9 horas → 1 h 54 min); promedio en horas y minutos; edición sin perder duración; rechazo de sueño y descanso que sumen más de 24 horas; rechazo de fechas futuras y de un segundo registro de descanso para la misma fecha; guía de uso y aviso de almacenamiento local.

## Decisiones integradas y preparación

Nueve pruebas de reglas ejecutadas con `node tests/analysis.test.mjs`: falta de información; recuperación baja con sesión intensa; ausencia de autorización médica implícita; semana de lunes a domingo; carga con cobertura mínima; búsqueda de competencias comparables entre deportes intermedios; exclusión de fútbol y levantamiento de pesas del análisis por tiempo; separación de fechas; y límites de calendario.

Recorrido integrado de navegador: metas personales, revisión única, orientación con motivos, actualización sin duplicar sueño, avance semanal, diario de alimentos opcional, comparación de preparación y tiempo incluyendo segundos, cobertura visible, informe de entrenador con contexto y conservación de datos anteriores.

## Usabilidad y recuperación de errores

Recorridos comprobados en Chromium de escritorio y a 390 píxeles: cuatro enlaces principales; menú móvil con teclado, Escape y estado de guardado accesible; foco en el título tras navegar; revisión por tres pasos con retroceso y conservación de respuestas; cancelación con cambios; errores persistentes junto al campo; guardado sin duplicar el descanso; eliminación y Deshacer; competencia en horas/minutos/segundos; perfil con medidas opcionales; metas parciales; tamaños táctiles de al menos 44 píxeles en los controles comprobados. No se observaron errores JavaScript durante ese recorrido.

También se comprobó la conservación de respuestas ante fallo de almacenamiento simulado, la protección de un perfil sin guardar, el enlace para saltar al contenido y el bloqueo del cierre mientras se espera una sincronización simulada. No se ha evaluado la experiencia con personas ni se afirma conformidad completa con una norma de accesibilidad. Código de estos recorridos: `tests/ux_browser.py` y `tests/ux_guards.py`.

## Recorrido basado en objetivos, planes y comidas

Pruebas actuales de reglas: 9 de análisis, 9 de calendario/compras, 3 de coherencia de sesiones/catálogo y 4 de carga de catálogo (25 en total). Los temporizadores se comprobaron para las 12 sesiones de cada plan y las tres duraciones: sus bloques suman exactamente 10, 20 o 30 minutos, incluyendo activación, descansos y vuelta a la calma. Los identificadores de instancia separan los minutos al reiniciar un plan el mismo día.

El recorrido en Chromium comprobó: elegir objetivo y duración; sesión con imágenes locales, temporizador, pausa y cambio de bloque; validación del tiempo real antes de guardar; calendario de 12 sesiones; pausa y cambio de plan conservando entrenamientos; corrección, eliminación y Deshacer manteniendo la relación con el plan; filtros de recetas; añadir una comida para una persona; ingredientes escalados y agrupados; marcar compras, descargar lista y quitar comidas; persistencia tras recargar y ancho de celular de 390 píxeles sin desbordamiento. Las herramientas anteriores mantienen sus pruebas de validación.

SQLite del catálogo: 12 ejercicios, 6 recetas, 3 planes, 9 circuitos, 36 referencias de ejercicios y 16 imágenes locales. Integridad comprobada; seis pruebas del generador. No contiene cuentas ni datos personales. La lectura de catálogo Supabase y las protecciones de guardado se probaron con API simulada: no se afirma conexión real, entrega de correos o aislamiento desplegado hasta configurar un proyecto externo y probarlo. La investigación y procedencia se documentan en INVESTIGACION.md.
