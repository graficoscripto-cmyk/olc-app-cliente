/* Service worker básico: sempre tenta a rede; o cache só serve quando está sem internet.
   Só guarda arquivos do próprio site. Chamadas ao servidor do Agente não passam por aqui. */
const CACHE = 'olc-agente-v10';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  /* a página é guardada sem os parâmetros do link (podem ter código de acesso) */
  const key = e.request.mode === 'navigate' ? url.origin + url.pathname : e.request;
  e.respondWith(fetch(e.request).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)); }
    return res;
  }).catch(() => caches.match(key).then(hit => hit || Response.error())));
});
