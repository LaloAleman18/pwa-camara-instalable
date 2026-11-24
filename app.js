const visor = document.querySelector('#visor-camara');
const visorVacio = document.querySelector('#visor-vacio');
const estado = document.querySelector('#estado-camara');
const aviso = document.querySelector('#aviso-permiso');
const preparar = document.querySelector('#btn-preparar-camara');
const controles = document.querySelector('#controles');
const alternar = document.querySelector('#btn-alternar-camara');
const apagar = document.querySelector('#btn-apagar-camara');
const instalar = document.querySelector('#btn-instalar');

const lenteInicial = 'environment';
let modoCamaraActual = lenteInicial;
let streamActual = null;
let solicitudPendiente = false;
let numeroSolicitud = 0;
let eventoInstalacionDiferido = null;

function actualizarMensajeEstado(mensaje) {
  estado.textContent = mensaje;
  estado.dataset.activa = Boolean(streamActual);
}

function actualizarControles() {
  visor.hidden = !streamActual;
  visorVacio.hidden = Boolean(streamActual);
  preparar.hidden = Boolean(streamActual) || solicitudPendiente || !aviso.hidden;
  controles.hidden = !streamActual && !solicitudPendiente;
  alternar.disabled = solicitudPendiente;
}

function mostrarAviso(mostrar) {
  aviso.hidden = !mostrar;
  preparar.setAttribute('aria-expanded', mostrar);
  actualizarControles();
}

function detenerCamaraActiva() {
  if (streamActual) streamActual.getTracks().forEach((track) => track.stop());
  streamActual = null;
  visor.srcObject = null;
}

function apagarCamara() {
  // Invalida un permiso pendiente incluso si el navegador lo concede después.
  numeroSolicitud++;
  solicitudPendiente = false;
  detenerCamaraActiva();
  mostrarAviso(false);
  actualizarMensajeEstado('Cámara apagada');
}

function mensajeError(error) {
  switch (error.name) {
    case 'NotAllowedError':
      return 'Acceso denegado. Revisa el permiso de cámara en los ajustes del sitio o del navegador.';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'El dispositivo no ofrece la cámara solicitada.';
    case 'NotReadableError':
    case 'AbortError':
      return 'No se pudo abrir la cámara. Cierra otras apps que la usen y vuelve a intentar.';
    default:
      return 'No se pudo iniciar la cámara. Vuelve a intentarlo.';
  }
}

function iniciarCamara(modo) {
  if (solicitudPendiente) return;
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    actualizarMensajeEstado('Abre la app por HTTPS o en localhost con un navegador compatible.');
    preparar.focus();
    return;
  }

  const solicitud = ++numeroSolicitud;
  const nombreLente = modo === 'environment' ? 'trasera' : 'frontal';
  const restricciones = { video: { facingMode: { exact: modo } }, audio: false };

  detenerCamaraActiva();
  solicitudPendiente = true;
  actualizarControles();
  actualizarMensajeEstado('Solicitando cámara ' + nombreLente + '…');
  apagar.focus();

  return navigator.mediaDevices.getUserMedia(restricciones)
    .then((stream) => {
      if (solicitud !== numeroSolicitud) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamActual = stream;
      modoCamaraActual = modo;
      visor.classList.toggle('frontal', modo === 'user');
      visor.srcObject = stream;
      stream.getVideoTracks().forEach((track) => {
        track.addEventListener('ended', () => {
          if (streamActual !== stream) return;
          apagarCamara();
          actualizarMensajeEstado('El navegador interrumpió el acceso a la cámara.');
        });
      });
      actualizarMensajeEstado('Cámara ' + nombreLente + ' activa');
    })
    .catch((error) => {
      if (solicitud === numeroSolicitud) actualizarMensajeEstado(mensajeError(error));
    })
    .finally(() => {
      if (solicitud !== numeroSolicitud) return;
      solicitudPendiente = false;
      actualizarControles();
      if (!streamActual) preparar.focus();
    });
}

preparar.addEventListener('click', () => {
  mostrarAviso(true);
  document.querySelector('#titulo-permiso').focus();
});

document.querySelector('#btn-cancelar-permiso').addEventListener('click', () => {
  mostrarAviso(false);
  preparar.focus();
});

document.querySelector('#btn-confirmar-permiso').addEventListener('click', () => {
  mostrarAviso(false);
  iniciarCamara(lenteInicial);
});

alternar.addEventListener('click', () => {
  iniciarCamara(modoCamaraActual === 'environment' ? 'user' : 'environment');
});

apagar.addEventListener('click', () => {
  apagarCamara();
  preparar.focus();
});
window.addEventListener('pagehide', apagarCamara);

const modoInstalado = window.matchMedia('(display-mode: standalone)');
const esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

function actualizarInstalacion() {
  const estaInstalada = navigator.standalone === true || modoInstalado.matches;
  document.querySelector('#instrucciones-ios').hidden = !esIOS || estaInstalada;
  instalar.hidden = esIOS || estaInstalada || !eventoInstalacionDiferido;
}

window.addEventListener('beforeinstallprompt', (evento) => {
  evento.preventDefault();
  eventoInstalacionDiferido = evento;
  actualizarInstalacion();
});

instalar.addEventListener('click', () => {
  if (!eventoInstalacionDiferido) return;
  const evento = eventoInstalacionDiferido;
  eventoInstalacionDiferido = null;
  actualizarInstalacion();
  evento.prompt()
    .then(() => evento.userChoice)
    .then((resultado) => {
      if (resultado.outcome === 'accepted') instalar.hidden = true;
    })
    .catch((error) => console.warn('No se pudo abrir el instalador:', error));
});

window.addEventListener('appinstalled', () => {
  eventoInstalacionDiferido = null;
  actualizarInstalacion();
});

modoInstalado.addEventListener?.('change', actualizarInstalacion);
actualizarInstalacion();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .catch((error) => console.warn('No se pudo registrar el service worker:', error));
}
