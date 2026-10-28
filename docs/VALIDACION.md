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
