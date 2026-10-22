// Trocar o número da versão força a limpeza do cache antigo
const CACHE = 'desenvolve-v1';
const ARQUIVOS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  // O catch evita que um ícone faltando impeça o service worker de instalar
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).catch(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(chaves => Promise.all(chaves.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first: sempre busca a versão nova; o cache só é usado quando está offline
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // Só cuida dos arquivos do próprio app; fontes externas seguem direto para a rede
  if (new URL(e.request.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then(resposta => {
        const copia = resposta.clone();
        caches.open(CACHE).then(c => c.put(e.request, copia));
        return resposta;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
