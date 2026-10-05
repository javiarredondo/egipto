// Service worker de la app de Egipto.
// - Guarda la pagina y los archivos propios (icono, imagenes subidas al repo) para abrir sin internet.
// - NUNCA toca /api/ (los datos compartidos los maneja la app con su propia copia local).
// - Para la pagina principal: usa internet si responde en 3 segundos; si no, muestra la copia guardada.
//   Asi, cuando se sube una version nueva se ve enseguida con senal, y sin senal abre igual.

const CACHE = 'egipto-cache-v1';
const SHELL = ['/', '/index.html', '/apple-touch-icon.png'];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return Promise.all(SHELL.map(function(u){ return c.add(u).catch(function(){}); }));
    })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys()
      .then(function(keys){ return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); })); })
      .then(function(){ return self.clients.claim(); })
  );
});

async function handleNavigate(req){
  const cache = await caches.open(CACHE);
  const cached = await cache.match('/index.html');
  const network = fetch(req).then(function(res){
    if(res && res.ok){ cache.put('/index.html', res.clone()); }
    return res;
  });
  if(!cached) return network;
  const timeout = new Promise(function(resolve){ setTimeout(function(){ resolve(cached); }, 3000); });
  return Promise.race([network.catch(function(){ return cached; }), timeout]);
}

async function handleStatic(req){
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req);
  const refresh = fetch(req).then(function(res){
    if(res && res.ok){ cache.put(req, res.clone()); }
    return res;
  }).catch(function(){ return cached; });
  return cached || refresh;
}

self.addEventListener('fetch', function(e){
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return;     // fuentes, mapas, fotos externas: las maneja el navegador
  if(url.pathname.indexOf('/api/') === 0) return;      // datos compartidos: nunca
  if(req.mode === 'navigate'){
    if(url.pathname === '/' || url.pathname === '/index.html'){ e.respondWith(handleNavigate(req)); }
    return;   // otra URL abierta directo (ej. una imagen): que la resuelva el navegador
  }
  e.respondWith(handleStatic(req));
});
