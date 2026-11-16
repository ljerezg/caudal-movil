// Guarda la web (no los datos) para que abra sin conexión. Lo de Dropbox nunca pasa por aquí.
const CACHE = 'caudal-movil-v2';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // La página: primero la red (para tener siempre la última versión), y si no hay, la guardada.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      // Sin la caché del navegador: GitHub Pages la deja 10 minutos y se vería la versión anterior.
      fetch(event.request, { cache: 'no-store' })
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./', copy));
          return res;
        })
        .catch(() => caches.match('./')),
    );
    return;
  }
  // Lo demás (scripts, estilos, sql-wasm, iconos) lleva su versión en el nombre: primero lo guardado.
  event.respondWith(
    caches.match(event.request).then(
      (hit) =>
        hit ??
        fetch(event.request).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(event.request, copy));
          }
          return res;
        }),
    ),
  );
});
