# Visor Local · Práctica 6.1 y 6.2

Visor Local es una PWA que muestra la cámara trasera o frontal del teléfono. Primero explica para qué necesita acceso y solo solicita el permiso después de que confirmas. El video se reproduce en el dispositivo, sin grabación, micrófono ni envío de imágenes. Está hecha con HTML, CSS y JavaScript Vanilla. La asincronía se maneja con promesas.

**Sitio de la práctica** [Abrir Visor Local](https://laloaleman18.github.io/pwa-camara-instalable/)

## Qué hace cada archivo

| Archivo | Función |
| --- | --- |
| `index.html` | Define el visor, los botones, el aviso de consentimiento y las instrucciones para iPhone/iPad. En el encabezado enlaza el manifiesto y el icono de Apple. |
| `styles.css` | Ajusta el diseño al ancho de la pantalla, define los estados visuales y refleja la imagen de la cámara frontal como un espejo. |
| `app.js` | Escucha los clics, administra el permiso, los flujos de cámara y la instalación. Registra el service worker. |
| `manifest.json` | Declara el nombre, el modo de apertura, el color y los iconos de la app instalada. |
| `sw.js` | Precarga la interfaz y sus archivos estáticos para poder abrirla sin conexión después de una primera visita exitosa. |
| `icons/` | Contiene dos PNG reales de 192 × 192 y 512 × 512 píxeles. |

## Cómo funciona el acceso a cámara

1. Al abrir la app, la cámara está apagada. **Solicitar acceso a cámara** ejecuta `mostrarAviso(true)` y muestra el aviso que explica qué se hará con el video. **Cancelar** lo cierra sin llamar a la API.
2. **Aceptar y encender cámara** invoca `iniciarCamara('environment')`. Esta función comprueba que el contexto sea seguro y llama a `navigator.mediaDevices.getUserMedia()`. El navegador decide si pregunta, concede o rechaza de acuerdo con sus permisos para el sitio.
3. `video: { facingMode: { exact: modo } }` exige el lente elegido. `environment` se refiere al trasero y `user` al frontal. Si el equipo tiene una sola cámara, alguno de los modos puede fallar. `audio: false` solicita únicamente video.
4. `.then()` recibe el `MediaStream` cuando la solicitud sale bien, lo conserva en `streamActual` y lo asigna a `visor.srcObject`. El HTML usa `autoplay playsinline muted` para reproducir dentro de la interfaz en móviles. `.catch()` muestra un mensaje para permisos denegados, lentes no disponibles o hardware ocupado. `.finally()` actualiza los controles tras resolver la solicitud.
5. **Cambiar cámara** calcula el modo opuesto y vuelve a llamar a `iniciarCamara()`. Antes de cada solicitud, `detenerCamaraActiva()` recorre las pistas con `getTracks()`, llama a `track.stop()` en cada una y limpia `srcObject`. El orden importa porque liberar el sensor evita que la apertura del siguiente lente falle.
6. **Apagar cámara** libera el sensor y deja visible el estado apagado. Si había un permiso pendiente, el contador `numeroSolicitud` invalida esa respuesta. Si posteriormente llega un flujo, se detienen sus pistas sin mostrarlo. `pagehide` también llama al apagado al abandonar la página.

`srcObject = null` retira la imagen del elemento HTML. `track.stop()` es la llamada que libera el uso de cada pista por esta app. En caso de bloqueo persistente, el usuario puede cambiar el permiso desde los ajustes del sitio y volver a confirmar en la interfaz.

## Cómo funciona la instalación

- `start_url: "./index.html"` abre el visor desde el icono instalado. `scope: "./"` delimita la app a su carpeta. Las rutas relativas mantienen los archivos bajo `/pwa-camara-instalable/` en GitHub Pages.
- `display: "standalone"` permite abrir la app en su propia ventana. `theme_color` y `background_color` definen sus colores. `purpose: "any maskable"` permite usar los iconos con las formas del sistema.
- En los navegadores que emiten `beforeinstallprompt`, `app.js` guarda el evento y revela **Instalar app**. Al pulsar el botón, `prompt()` abre el diálogo nativo y `userChoice` informa la decisión. Si se cierra el cuadro, puede usarse el menú del navegador para instalar si está disponible.
- En Safari de iPhone/iPad, el código comprueba el dispositivo y si ya se ejecuta en modo instalado. Si sigue abierto en el navegador, muestra la guía **Compartir → Agregar a inicio**. Si aparece **Abrir como app web**, actívalo. La etiqueta `apple-touch-icon` apunta al PNG de 192 píxeles. Al abrir desde la pantalla de inicio, el sistema puede pedir el permiso de cámara de nuevo. [Guía de Safari para iPhone](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/27/ios/27)
- El service worker carga los seis recursos en el evento `install`. En `activate` elimina versiones anteriores de su caché y toma control de la página. En `fetch` usa **Cache First** para esos archivos, consultando primero la copia local y recurriendo a la red si falta. Si publicas cambios en estos archivos, cambia también `visor-local-v1` a `visor-local-v2` en `sw.js` y cierra las ventanas antiguas para permitir que se active el nuevo worker.

## Prueba local en Windows

Desde PowerShell, entra a esta carpeta y ejecuta `python -m http.server 8000`. Abre [http://localhost:8000/](http://localhost:8000/) en Chrome o Edge. Detén el servidor con **Ctrl+C**. Para el teléfono, usa la URL HTTPS de Pages. Un enlace HTTP con la IP de tu computadora normalmente carece del contexto seguro que la cámara exige.

## Cómo subir el proyecto a GitHub Pages

1. Crea en GitHub un repositorio público llamado `pwa-camara-instalable`. Si ya existe, abre ese repositorio.
2. Sube el contenido de esta carpeta a la raíz de la rama `main`. En GitHub puedes usar **Add file → Upload files** y confirmar con **Commit changes**. En la pestaña **Code**, verifica que `index.html` esté en la raíz y que ambos PNG estén dentro de `icons/`.
3. En **Settings → Pages**, selecciona **Deploy from a branch**. Elige **main**, **/(root)** y guarda.
4. Espera el despliegue en **Actions** y abre la URL de **Settings → Pages**. Comprueba que comience con `https://`. En un repositorio de proyecto la URL tiene la forma `https://TU-USUARIO.github.io/pwa-camara-instalable/`. [Documentación de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

Para actualizar un repositorio que ya clonaste, copia tus cambios a ese clon y ejecuta `git add .`, `git commit -m "Actualiza Visor Local"` y `git push`. Pages vuelve a publicar la rama configurada.

## Lista de revisión para clase

- [ ] Abre el sitio HTTPS en Chrome de escritorio. En **DevTools → Application → Manifest**, comprueba el nombre, los iconos y el modo `standalone`. En **Service Workers**, verifica que el worker esté activo.
- [ ] Abre el enlace en Chrome para Android o Safari para iPhone. Instálalo y ejecútalo desde el icono de inicio. Comprueba que abra en ventana independiente.
- [ ] Pulsa **Solicitar acceso a cámara** y luego **Cancelar**. Comprueba que el teléfono no haya pedido permiso.
- [ ] Vuelve a abrir el aviso y confirma. Con el permiso concedido, comprueba que se muestre la cámara trasera.
- [ ] Cambia a la frontal, vuelve a la trasera y apaga. Comprueba la imagen de ambos lentes y que desaparezca el indicador de cámara al apagar.
- [ ] Si bloqueas el permiso para probar el error, restáuralo en los ajustes del sitio antes de exponer.
- [ ] Abre la app una vez con conexión, cierra y vuelve a abrir sin conexión. Verifica que cargue la interfaz.

## Cómo explicarlo en clase

«El manifiesto define cómo aparece la app cuando se instala. El service worker guarda los archivos de la interfaz. La cámara se enciende en dos pasos: el primer botón muestra el aviso y el segundo llama a `getUserMedia()`. La promesa devuelve un flujo que asigno a `srcObject`. Para cambiar de lente, primero detengo las pistas del flujo anterior con `track.stop()` y después pido el nuevo».

Para comprobar que lo entendiste, sigue en `app.js` el clic de **Cambiar cámara** hasta `getUserMedia()`. Ubica la línea donde se libera el lente anterior y explica cómo cambiaría el comportamiento si se ejecutara después de pedir el nuevo.
