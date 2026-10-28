# Usabilidad de ELITECORE

Los cambios buscan que una persona pueda identificar qué hacer, registrar su actividad y entender sus resultados sin conocer términos técnicos. Se toman como referencia las heurísticas de usabilidad de Nielsen.

| Principio | Cambio que se puede comprobar |
| --- | --- |
| Estado visible | La interfaz indica dónde se guardan los datos y confirma las acciones de guardar. El estado de almacenamiento sigue disponible en celular. |
| Lenguaje familiar | Las preguntas usan palabras cotidianas y las opciones de energía y recuperación tienen etiquetas. Los tiempos se introducen en horas, minutos y segundos, según el registro. |
| Control de la persona | Se puede cancelar un formulario, revisar antes de descartar cambios y deshacer la eliminación de un registro. |
| Consistencia | La navegación, los botones de guardar, cancelar, editar y eliminar mantienen nombres y comportamientos comunes. |
| Prevención de errores | Los campos tienen límites y unidades claras. Las validaciones evitan fechas futuras, minutos fuera de rango y tiempos de descanso imposibles. |
| Recuperación de errores | Los mensajes aparecen dentro del formulario, permanecen mientras se corrige el problema e indican qué cambiar. |
| Reconocimiento | Las opciones visibles y las etiquetas reducen la necesidad de memorizar el significado de números o símbolos. |
| Diseño sencillo | Inicio da prioridad a la revisión del día y al avance semanal. Los detalles y las explicaciones amplias se consultan cuando se necesitan. |
| Ayuda | La ayuda de uso explica el primer paso, el significado de los datos y los límites de cada función. |
| Accesibilidad básica | Se mejora el tamaño del texto, el contraste, las áreas táctiles, los nombres accesibles y el manejo del foco en navegación y diálogos. |

## Cómo revisar los cambios

1. Abre la página desde un celular o usa una ventana de unos 390 píxeles de ancho. Comprueba que puedes encontrar Inicio, registrar una actividad y volver a tu progreso.
2. Completa una revisión diaria sin consultar instrucciones externas. Revisa si las opciones y las unidades permiten responder con confianza.
3. Introduce un valor no permitido y comprueba que el mensaje explica cómo corregirlo sin borrar las respuestas válidas.
4. Empieza a editar un registro y cancela. Comprueba que puedes conservarlo o descartar los cambios de forma clara.
5. Elimina un registro y utiliza Deshacer. Verifica que se recupera.
6. Navega con Tab y Shift + Tab. Comprueba que el foco es visible y que los formularios y los diálogos se pueden utilizar con teclado.
7. Revisa un resultado y abre su explicación. Comprueba si entiendes qué datos se usaron y cuáles faltan.

## Alcance y pendientes

Las comprobaciones automáticas de reglas, recorridos de navegador y accesibilidad básica ayudan a detectar errores funcionales. **No sustituyen una evaluación con usuarios ni demuestran que la aplicación sea cómoda para todas las personas.** No se han realizado pruebas de usabilidad con participantes.

Antes de considerar validada la experiencia, conviene pedir a deportistas con distintos niveles de familiaridad tecnológica que completen las tareas anteriores sin ayuda. Se debe observar dónde dudan, qué errores cometen, si entienden los resultados y qué funciones les aportan utilidad. Sus comentarios deben orientar los siguientes cambios.

El acceso a cuentas y la sincronización entre dispositivos siguen sujetos a que el propietario configure Supabase. Sin esa conexión, los registros se guardan en el navegador utilizado y requieren una copia exportada para conservarlos fuera de él. Tampoco hay una conexión automática con dispositivos deportivos ni acceso remoto de entrenadores.
