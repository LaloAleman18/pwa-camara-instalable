const prefijoCache = 'visor-local-';
const nombreCache = prefijoCache + 'v1';
const recursos = [
  './index.html', './styles.css', './app.js', './manifest.json',
  './icons/icon-192.png', './icons/icon-512.png'
];
const base = self.registration.scope;
const rutasLocales = new Set(recursos.map((ruta) => new URL(ruta, base).href));

self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(nombreCache).then((cache) => cache.addAll(recursos)));
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((nombres) => Promise.all(nombres
        .filter((nombre) => nombre.startsWith(prefijoCache) && nombre !== nombreCache)
        .map((nombre) => caches.delete(nombre))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (evento) => {
  const { request } = evento;
  if (request.method !== 'GET') return;

  // La raíz del repositorio comparte la copia precargada de index.html.
  const ruta = request.mode === 'navigate' && request.url === base
    ? new URL('./index.html', base).href
    : request.url;
  if (!rutasLocales.has(ruta)) return;

  evento.respondWith(
    caches.open(nombreCache)
      .then((cache) => cache.match(ruta))
      .then((respuesta) => respuesta || fetch(request))
      .catch(() => fetch(request))
  );
});
