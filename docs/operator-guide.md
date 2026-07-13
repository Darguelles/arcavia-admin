# Guía del operador — Arcavia Admin

Esta guía está escrita para el administrador de la plataforma. No se necesitan conocimientos técnicos.

---

## Acceso al panel

1. Abre el navegador y ve a la dirección del panel (ejemplo: `https://tu-dominio.com/admin`).
2. Ingresa tu correo electrónico y contraseña.
3. Si ves la pantalla de "Establecer nueva contraseña", sigue las instrucciones antes de continuar.

---

## Agregar una ciudad

1. En el menú izquierdo, haz clic en **Ciudades**.
2. Haz clic en **+ Crear**.
3. Completa los campos:
   - **Nombre**: nombre de la ciudad tal como aparecerá en la app.
   - **Código corto**: se sugiere automáticamente. Usa solo minúsculas y guiones (ej: `lima`).
   - **País**, **Idioma**, **Zona horaria**, **Reglas de privacidad**: selecciona de las opciones.
4. En el mapa **"Área del mapa de la ciudad"**:
   - Haz **clic izquierdo dos veces** en el mapa para dibujar el rectángulo que cubre la ciudad.
   - Haz **clic derecho** para colocar el centro de la ciudad.
5. Haz clic en **Guardar**.

---

## Crear una misión y calibrar su ubicación en campo

### Antes de salir al campo

1. Ve a **Misiones** → **+ Crear**.
2. Elige la campaña, pon un nombre y guarda.

### En el campo (calibración)

1. Imprime el código QR (ver "Generar y imprimir un QR" más abajo) y colócalo físicamente en el lugar.
2. Anota las coordenadas exactas del lugar donde pegaste el QR. Puedes usar Google Maps en tu teléfono (mantén presionado el punto para ver las coordenadas).

### Después de regresar

1. Ve a la misión → pestaña **Ubicación**.
2. Haz clic en el mapa en el punto exacto donde está el QR físico. Aparecerá un pin y un círculo que indica el área de captura.
3. Ajusta el radio (**Proximidad requerida**) si necesitas que los jugadores estén más cerca o más lejos.
4. En la pestaña **Detalles**, anota las notas de calibración en el campo correspondiente.
5. Haz clic en **Guardar**.

---

## Escribir las preguntas de una misión

1. Abre la misión → pestaña **Preguntas**.
2. Haz clic en **+ Agregar pregunta**.
3. Escribe el enunciado de la pregunta.
4. Agrega al menos 2 opciones de respuesta.
5. Marca el botón redondo (radio) de la **opción correcta**.
6. Repite para agregar más preguntas. Puedes reordenarlas arrastrando el icono ⠿.
7. Haz clic en **Guardar**.

> **Importante:** Una misión necesita al menos una pregunta antes de poder activarse.

---

## Generar y imprimir un código QR

1. Abre la misión → pestaña **Código QR**.
2. Haz clic en **Generar código QR**.
3. Aparecerá el QR en pantalla.
4. Haz clic en **🖨 Descargar para imprimir**.
5. Imprime y coloca el código en el lugar físico correspondiente.

> **Aviso importante:** Si generas un nuevo QR para una misión que ya tiene uno, el código impreso anterior dejará de funcionar cuando desactives el anterior. Siempre reimprime y reemplaza el código físico.

---

## Reemplazar un código QR comprometido

Si un código QR fue dañado o comprometido:

1. Ve a la misión → pestaña **Código QR**.
2. Haz clic en **Retirar código QR** y confirma.
3. Haz clic en **Generar código QR** para crear uno nuevo.
4. Imprime y reemplaza el código físico en el lugar.

---

## Activar una misión

1. Asegúrate de que la misión tiene al menos una pregunta (pestaña **Preguntas**).
2. Ve a la pestaña **Detalles**.
3. Activa la casilla **Activo**.
4. Haz clic en **Guardar**.

> Si la casilla está deshabilitada, el mensaje te indicará que faltan preguntas.

---

## Leer los mejores puntajes (auditoría de premios)

1. En el menú izquierdo, haz clic en **Panel**.
2. En la sección **Mejores puntajes** verás la lista de jugadores con más puntos.
3. Usa el filtro de ciudad (arriba, en el encabezado) para ver los puntajes por ciudad.

> **Nota:** El GPS web no es completamente a prueba de suplantación. Úsalo como referencia, no como evidencia única.

---

## Restablecer la contraseña de un usuario

1. Ve a **Usuarios**.
2. Busca al usuario por correo.
3. Haz clic en **Ver detalle**.
4. Haz clic en **Restablecer contraseña** y confirma.
5. Aparecerá una contraseña temporal en pantalla.
6. **Copia la contraseña** y entrégala al usuario directamente (en persona o por teléfono).
7. Haz clic en **Cerrar — ya copié la contraseña**.

> **La contraseña temporal no se mostrará de nuevo.** El usuario deberá cambiarla en su próximo inicio de sesión.

---

## Desactivar un usuario

1. Ve a **Usuarios** → selecciona al usuario.
2. Haz clic en **Desactivar** y confirma.
3. El usuario no podrá iniciar sesión. Sus datos y progreso se conservan.

Para reactivarlo, haz clic en **Activar** en la misma pantalla.

---

## Actualizar la política de privacidad

1. Ve a **Configuración** → sección **Información de la app**.
2. Edita el texto de la política.
3. Cuando guardes, el sistema preguntará si deseas aumentar el número de versión.
4. Haz clic en **Sí, aumentar versión** para que los usuarios acepten la nueva política.
5. Haz clic en **Guardar**.
