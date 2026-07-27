/*
  Sistema de imágenes de FutGonZ
  --------------------------------
  Objetivo: catálogo con carga prácticamente instantánea, sea cual sea el número de camisetas.

  1) Resolución automática comprimida/original
     En cada build, "scripts/generate-image-manifest.js" escanea el repositorio y genera
     "image-manifest.json" con la lista de imágenes que SÍ tienen una versión "_comp".
     Este módulo carga ese manifest una vez (con timeout de seguridad) y, a partir de ahí,
     resolve(url) decide al instante qué archivo usar. Sin peticiones fallidas, sin tocar
     products.js nunca.

  2) Precarga predictiva en segundo plano (mecanismo PRINCIPAL de carga)
     El catálogo llama a ImageSystem.prefetch(urls) justo después de pintar el lote actual,
     pasándole las imágenes del siguiente lote (p.ej. si se muestran las tarjetas 1-20, se
     precargan en silencio las 21-40). Se descargan con new Image() -no se muestran-, con
     concurrencia limitada y fetchPriority "low" para no competir por ancho de banda con lo
     que el usuario está viendo ahora mismo. En conexiones 2G o con "ahorro de datos"
     activado, la precarga por adelantado se desactiva sola.

  3) IntersectionObserver como red de seguridad
     Ya no es el mecanismo principal: cubre los casos que el prefetch predictivo no
     adelantó (entrar directo a un producto por enlace, saltos de scroll extremos, etc).
     rootMargin ampliado para dar más margen de reacción.

  4) Imagen trasera bajo demanda
     Nunca se pide al pintar el catálogo. Se pide solo cuando hay intención real de verla
     (hover/touch en la tarjeta) o al abrir la ficha del producto.

  5) Mejora a HD imperceptible
     El modal de producto se abre al instante con la imagen ya cargada (comprimida u
     original) y, en paralelo, descarga la versión HD; cuando está decodificada, sustituye
     el "src" sin parpadeo.
*/
const ImageSystem = (() => {
  let manifest = {};

  // --- Estado de la precarga predictiva ---
  const PREFETCH_CONCURRENCY = 4; // nº de descargas de precarga simultáneas como máximo
  const prefetchQueue = [];
  const prefetchSeen = new Set(); // evita pedir dos veces la misma URL
  let activePrefetches = 0;

  // No forzamos precarga por adelantado si el usuario va con datos limitados: en 2G/slow-2G
  // o con "Ahorro de datos" activado, dejamos que sea solo el IntersectionObserver quien pida
  // imágenes (más tarde, pero sin gastar de más en algo que quizá no se llegue a ver).
  function isConstrainedNetwork() {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn) return false;
    if (conn.saveData) return true;
    return conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g';
  }

  // Ejecuta la cola de precarga respetando el límite de concurrencia.
  function runPrefetchQueue() {
    while (activePrefetches < PREFETCH_CONCURRENCY && prefetchQueue.length) {
      const url = prefetchQueue.shift();
      activePrefetches++;
      const img = new Image();
      if ('fetchPriority' in img) img.fetchPriority = 'low';
      const done = () => { activePrefetches--; runPrefetchQueue(); };
      img.onload = done;
      img.onerror = done;
      img.src = url; // el navegador cachea la respuesta; cuando se pinte de verdad, sale de caché
    }
  }

  function schedule(fn) {
    if ('requestIdleCallback' in window) requestIdleCallback(fn, { timeout: 2000 });
    else setTimeout(fn, 200);
  }

  // API pública: recibe URLs "originales" de producto (las mismas que se pasarían a
  // lazyLoad) correspondientes al SIGUIENTE lote de tarjetas, y las descarga en silencio,
  // sin tocar el DOM. El catálogo debe llamarla justo después de pintar el lote actual:
  //   renderPage(products.slice(0, 20));
  //   ImageSystem.prefetch(products.slice(20, 40).map(p => p.image));
  function prefetch(urls) {
    if (!urls || !urls.length || isConstrainedNetwork()) return;
    manifestReady.then(() => {
      schedule(() => {
        urls.forEach(url => {
          const { catalogSrc } = resolve(url);
          if (prefetchSeen.has(catalogSrc)) return;
          prefetchSeen.add(catalogSrc);
          prefetchQueue.push(catalogSrc);
        });
        runPrefetchQueue();
      });
    });
  }

  function fetchManifest() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);
    return fetch('image-manifest.json', { cache: 'force-cache', signal: controller.signal })
      .then(response => (response.ok ? response.json() : {}))
      .catch(() => ({}))
      .finally(() => clearTimeout(timeoutId));
  }

  // Promesa que se resuelve cuando ya sabemos qué imágenes tienen versión comprimida.
  // Si el manifest no existe todavía (p.ej. primer despliegue sin build) o tarda demasiado,
  // se resuelve igualmente con {} y el sistema usa las imágenes originales sin romper nada.
  const manifestReady = fetchManifest().then(data => {
    manifest = data && typeof data === 'object' ? data : {};
    return manifest;
  });

  function compCandidate(url) {
    const match = url.match(/^(.*)(\.[a-zA-Z0-9]+)$/);
    if (!match) return url;
    return `${match[1]}_comp${match[2]}`;
  }

  // Decide qué versión usar en el catálogo: la comprimida SOLO si el manifest confirma que
  // existe; si no, la original directamente (nunca se adivina "a ciegas" para no generar
  // peticiones fallidas).
  function resolve(url) {
    const hasComp = manifest[url] === true;
    return { catalogSrc: hasComp ? compCandidate(url) : url, hdSrc: url, hasComp };
  }

  // --- Carga diferida compartida (red de seguridad; el prefetch predictivo es el mecanismo
  // principal). rootMargin amplio porque ahora es barato: solo entra en juego para lo que
  // el prefetch no llegó a adelantar. ---
  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver(handleIntersections, { rootMargin: '2000px 0px', threshold: 0.01 })
    : null;

  function handleIntersections(entries) {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      applySrc(entry.target);
    }
  }

  function applySrc(img) {
    const src = img.dataset.src;
    if (!src) return;
    img.src = src; // si ya fue precargada vía prefetch(), el navegador la sirve de caché al instante
    delete img.dataset.src;
  }

  // Marca una <img> para carga diferida. Sin soporte de IntersectionObserver (muy residual
  // hoy en día) se carga directamente: peor caso, se comporta como una web sin lazy loading.
  function lazyLoad(img, src) {
    img.dataset.src = src;
    if (observer) observer.observe(img);
    else applySrc(img);
  }

  // --- Mejora a HD en segundo plano, sustitución imperceptible ---
  function upgradeToHD(imgEl, hdSrc) {
    const swap = () => { imgEl.src = hdSrc };
    const preloader = new Image();
    preloader.src = hdSrc;
    if (preloader.decode) preloader.decode().then(swap).catch(swap);
    else { preloader.onload = swap; preloader.onerror = () => {}; }
  }

  return { manifestReady, resolve, lazyLoad, upgradeToHD, prefetch };
})();
