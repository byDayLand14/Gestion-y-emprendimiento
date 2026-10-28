# ELITECORE

Aplicación web adaptable que relaciona preparación y resultados deportivos para ayudar a decidir qué revisar. Integra una revisión diaria, metas personales y comparaciones de competencias con los siete días de preparación anteriores. Interfaz en español con explicaciones calculadas a partir de registros reales del usuario. Sin referencias institucionales ni créditos personales.

## Abrir en Visual Studio Code

1. Descomprime el ZIP y abre la carpeta ELITECORE en VS Code.
2. Abre `index.html` usando la extensión **Live Server** (botón Go Live). Alternativamente instala Python 3 y ejecuta `python3 -m http.server 8080` desde esta carpeta. En Windows: `py -m http.server 8080`.
3. Abre la dirección que indique el servidor en tu navegador. No abras directamente como archivo: usa un servidor local.

No se necesita instalar dependencias, compilar ni ejecutar npm install. `npm start` también inicia el servidor si tienes Node y Python 3. `npm run check` comprueba la sintaxis JavaScript.

## Funciones incluidas

- Revisión diaria única: sueño, recuperación, energía, exigencia prevista y organización alimentaria. Reutiliza el sueño del día sin duplicarlo.
- Orientaciones explicables que cruzan la sesión prevista con descanso y energía. No se calcula una puntuación médica.
- Metas personales de sesiones, minutos semanales y sueño, con avance de lunes a domingo.
- Comparación de carga registrada (minutos × esfuerzo), con al menos tres sesiones completas por período.
- Perfil con disciplina, experiencia, medidas y objetivo.
- Alta, edición y eliminación de sesiones, comidas, descanso y resultados deportivos.
- Actividad de los últimos siete días, promedios y orientaciones con reglas sencillas.
- Comparación de la competencia más reciente con la anterior de igual disciplina y distancia. Se busca entre todo el historial, en fechas distintas; solo se interpretan tiempos de atletismo, ciclismo, natación y trail.
- Comparación de preparación: volumen del mismo deporte, sueño y cumplimiento declarado de planificación alimentaria en los siete días previos. Se indica la cobertura y no se afirman causas.
- Diario detallado de alimentos e historial de descanso opcionales, separados de la revisión rápida.
- Importación CSV con validación, plantilla y exportación JSON.
- Informe de seguimiento descargable sujeto a autorización del usuario.
- Cuenta por correo y contraseña y sincronización opcional con Supabase.
- Eliminación de los registros del espacio desde Mi perfil.

Los registros empiezan vacíos. El directorio no publica personas sin verificación. No se cobran suscripciones, no se realizan diagnósticos y no se conectan relojes o chips automáticamente. Se pueden importar sus resultados mediante CSV. El panel de seguimiento se entrega como informe compartible; no hay un portal remoto de entrenador o administrador. No se incluye una aplicación nativa para las tiendas Android/iOS.

## Organización

```text
ELITECORE/
  index.html              Página y estructura de navegación
  icon.svg                Identidad gráfica
  css/style.css           Diseño adaptable
  js/app.js               Registros, análisis, importación y cuentas
  js/analysis.mjs          Reglas de análisis explicables
  js/product-views.mjs     Paneles de decisiones y comparación
  tests/analysis.test.mjs  Pruebas de reglas y datos incompletos
  js/config.js            Configuración pública de Supabase
  database/supabase.sql    Tabla, permisos y aislamiento entre cuentas
  docs/PUBLICAR.md         Guía de hosting y base de datos
  docs/VALIDACION.md       Alcance de las verificaciones
  package.json            Comandos opcionales
```

## Almacenamiento y privacidad

Sin Supabase, los datos solo se conservan en localStorage de ese navegador. No es una copia de seguridad ni una base compartida. Exporta antes de cambiar de dispositivo. Una sesión de cuenta se conserva en sessionStorage hasta cerrar la pestaña; al caducar debes iniciar sesión otra vez. Un error de sincronización mantiene la copia local y muestra un aviso. No hay edición simultánea ni resolución de conflictos: la última escritura reemplaza el espacio completo.

Con cuenta, la base de datos aplica seguridad por fila para que cada usuario acceda únicamente a su información. No incluyas claves administrativas en archivos públicos. Al cerrar sesión desde la aplicación se limpia el espacio local. Antes de ofrecer el servicio públicamente adapta los textos de privacidad a tu responsable y contacto, comprueba las condiciones de tratamiento de datos personales y configura copias de seguridad. La aplicación no sustituye atención médica.

## Publicación

Sigue [la guía paso a paso](docs/PUBLICAR.md). Puedes alojar la web estática en GitHub Pages y usar Supabase para autenticación y base de datos. Los planes gratuitos tienen límites y sus condiciones pueden cambiar.

En el pie de la página está **Cómo usar la aplicación**, con una explicación de cada módulo. El sueño se introduce en dos campos separados (horas y minutos); se permite un registro por fecha, sin fechas futuras, y el sueño más el descanso adicional no puede superar 24 horas por día. Los datos anteriores se conservan y se muestran convertidos a horas y minutos.

## Reglas y límites del análisis

Ejecuta `npm test` (o `node tests/analysis.test.mjs`) para las nueve pruebas del análisis; no se instalan dependencias. Las orientaciones cruzan respuestas personales con la meta de sueño que define el usuario. Un valor de energía o recuperación de 1–2 sobre 5 invita a revisar la exigencia prevista; no mide fatiga fisiológica. La carga es una suma de minutos por esfuerzo declarado y no predice lesiones. No se inventan datos de días sin registro.

Los dos períodos de preparación se muestran separados antes de competencias comparables. Los promedios de sueño siempre indican cuántos días tienen datos, y solo se describe su cambio con al menos tres días por período. El seguimiento alimentario refleja organización declarada, no suficiencia energética ni calidad de una dieta. No se crean dietas a partir de edad o peso. Las decisiones sobre entrenamiento y nutrición deben contrastarse con profesionales cuando corresponda.
