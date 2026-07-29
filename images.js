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

  2) Carga diferida real
     Un único IntersectionObserver, compartido por todas las tarjetas aunque haya miles,
     observa cada imagen y solo le asigna "src" cuando está a punto de entrar en pantalla
     (rootMargin actúa como colchón de precarga).

  3) Imagen trasera bajo demanda
     Nunca se pide al pintar el catálogo. Se pide solo cuando hay intención real de verla
     (hover/touch en la tarjeta) o al abrir la ficha del producto.

  4) Mejora a HD imperceptible
     El modal de producto se abre al instante con la imagen ya cargada (comprimida u
     original) y, en paralelo, descarga la versión HD; cuando está decodificada, sustituye
     el "src" sin parpadeo.
*/
const ImageSystem = (() => {
  let manifest = {};

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

  // --- Carga diferida compartida ---
  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver(handleIntersections, { rootMargin: '600px 0px', threshold: 0.01 })
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
    img.src = src;
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

  return { manifestReady, resolve, lazyLoad, upgradeToHD };
})();
