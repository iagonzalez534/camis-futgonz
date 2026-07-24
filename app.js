const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const INSTAGRAM_USER='futgonz';
let favorites=new Set(JSON.parse(localStorage.getItem('futgonz-favorites')||'[]'));
let showingFavorites=false;
let visibleProducts=30;
const money=value=>value.toLocaleString('es-ES',{style:'currency',currency:'EUR'});

function saveFavorites(){localStorage.setItem('futgonz-favorites',JSON.stringify([...favorites]));$('#favoritesCount').textContent=favorites.size;$('#favoritesToggle').setAttribute('aria-label',`Ver mis favoritos (${favorites.size})`)}
function card(product){
  const fragment=$('#cardTemplate').content.cloneNode(true),favorite=fragment.querySelector('.favorite'),open=fragment.querySelector('.card-open');
  const [mainImage,hoverImage]=fragment.querySelectorAll('.product-photo');
  mainImage.src=product.images[0].src;mainImage.alt=product.images[0].alt;hoverImage.src=product.images[1].src;hoverImage.alt='';
  fragment.querySelector('.badge').textContent=product.type;fragment.querySelector('.meta').textContent=`${product.category} · ${product.season} · ${product.id}`;
  fragment.querySelector('h3').textContent=product.name;fragment.querySelector('.price').textContent=money(product.price);
  favorite.textContent=favorites.has(product.id)?'♥':'♡';favorite.classList.toggle('active',favorites.has(product.id));
  favorite.onclick=event=>{event.stopPropagation();favorites.has(product.id)?favorites.delete(product.id):favorites.add(product.id);saveFavorites();render()};open.onclick=()=>openModal(product);return fragment;
}
function matchesType(product,type){return !type||(type==='Retro'?product.isRetro:!product.isRetro)}
function normalizeSearch(value){return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function searchAliases(product){const aliases={'FC Barcelona':['barca','barcelona','fcb'],'Real Madrid':['madrid','real'],'Atl\u00e9tico de Madrid':['atleti','atletico'],'Paris Saint-Germain':['psg'],'Manchester United':['man united','manchester'],'Manchester City':['man city','city'],'Bayern M\u00fcnchen':['bayern'],'Borussia Dortmund':['dortmund'],'Inter':['inter milan'],'Juventus':['juve']};return aliases[product.team]||[]}
function currentProducts(){
  const query=normalizeSearch($('#search').value.trim());const values={category:$('#categoryFilter').value,league:$('#leagueFilter').value,team:$('#teamFilter').value,season:$('#seasonFilter').value,brand:$('#brandFilter').value,available:$('#stockFilter').value};
  return PRODUCTOS.filter(product=>{const search=normalizeSearch([product.id,product.name,product.team,product.country,product.league,product.brand,...searchAliases(product)].join(' '));return(!query||search.includes(query))&&matchesType(product,$('#typeFilter').value)&&Object.entries(values).every(([key,value])=>!value||product[key]===value)&&(!showingFavorites||favorites.has(product.id))});
}
function render(){const products=currentProducts(),shown=products.slice(0,visibleProducts),grid=$('#productGrid');if(showingFavorites&&!products.length){const empty=document.createElement('section');empty.className='favorites-empty';empty.innerHTML='<span class="favorites-empty__icon" aria-hidden="true">&hearts;</span><h3>Aun no tienes camisetas guardadas.</h3><p>Guarda tus favoritas pulsando el corazon de cualquier camiseta.</p><button id="backToCatalog" class="primary" type="button">Volver al catalogo <span>&rarr;</span></button>';grid.replaceChildren(empty);$('#backToCatalog').onclick=()=>{showingFavorites=false;visibleProducts=30;$('.favorites-label').textContent='Mis favoritos';$('#favoritesCount').hidden=false;render();location.hash='catalogo'}}else grid.replaceChildren(...shown.map(card));$('#resultCount').textContent=`${products.length} camisetas${showingFavorites?' guardadas':''}`;$('#favoritesToggle').classList.toggle('active',showingFavorites);$('#favoritesToggle').classList.toggle('has-favorites',favorites.size>0);$('#loadMore').hidden=showingFavorites&&!products.length||shown.length>=products.length}
function copyText(text){if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(text);const area=document.createElement('textarea');area.value=text;document.body.append(area);area.select();document.execCommand('copy');area.remove();return Promise.resolve()}
function toast(message){let node=$('#toast');if(!node){node=document.createElement('div');node.id='toast';node.setAttribute('role','status');document.body.append(node)}node.textContent=message;node.classList.add('show');setTimeout(()=>node.classList.remove('show'),4000)}
function availablePatches(product){
  const europe=['Espa\u00f1a','Francia','Alemania','Italia','Portugal','Inglaterra','B\u00e9lgica','Croacia','Pa\u00edses Bajos'];
  const america=['Argentina','Brasil','Uruguay','M\u00e9xico','Colombia','Venezuela'];
  const africa=['Marruecos'];
  const asia=['Jap\u00f3n'];
  const country=product.country;
  if(product.category==='Selecci\u00f3n'){
    if(europe.includes(country))return ['Sin parche','Mundial','Eurocopa','Nations League'];
    if(america.includes(country))return ['Sin parche','Mundial','Copa Am\u00e9rica'];
    if(africa.includes(country))return ['Sin parche','Mundial','Copa Africana de Naciones'];
    if(asia.includes(country))return ['Sin parche','Mundial','Copa Asi\u00e1tica'];
    return ['Sin parche','Mundial'];
  }
  const domestic={
    'Espa\u00f1a':['LaLiga','Copa del Rey','Supercopa de Espa\u00f1a'],
    Inglaterra:['Premier League','FA Cup','Carabao Cup'],
    Italia:['Serie A','Coppa Italia','Supercoppa Italiana'],
    Alemania:['Bundesliga','DFB-Pokal','Supercopa de Alemania'],
    Francia:['Ligue 1','Coupe de France','Troph\u00e9e des Champions'],
    Portugal:['Liga Portugal','Ta\u00e7a de Portugal','Superta\u00e7a']
  };
  return ['Sin parche',...(domestic[country]||[product.league]),'Champions League','Europa League','Conference League'];
}
function openModal(product){
  const dialog=$('#productModal');let selectedSize='M',selectedType='Fan',selectedPatch='Sin parche',photoIndex=0,guideOpen=false;
  const related=PRODUCTOS.filter(item=>item.id!==product.id&&(item.team===product.team||item.league===product.league)).slice(0,3);
  const gallery=()=>`<div class="gallery"><div class="gallery__main"><img id="galleryMain" src="${product.images[photoIndex].src}" alt="${product.images[photoIndex].alt}"><span class="zoom-hint">Pulsa para ampliar</span></div><div class="gallery__thumbs">${product.images.map((photo,index)=>`<button class="gallery__thumb ${index===photoIndex?'active':''}" data-gallery-index="${index}" aria-label="Ver foto ${index+1}"><img src="${photo.src}" alt=""></button>`).join('')}</div></div>`;
  const version=product.isRetro?`<fieldset class="retro-info"><legend>Tela</legend><strong>Retro</strong><p>Las camisetas retro no tienen versión Fan ni Jugador para elegir: mantienen su diseño clásico original en una única tela.</p></fieldset>`:`<fieldset><legend>Versión</legend><div class="type-toggle"><button class="selected" data-type="Fan">Fan</button><button data-type="Jugador">Jugador</button></div><p id="typeHint">Corte clásico, cómodo para el uso diario y con excelente relación calidad-precio.</p></fieldset>`;
  const guide=()=>`<figure class="size-guide"><img src="tabla.png" alt="Tabla de tallas de camisetas de futbol para hombre"><figcaption>Guia de tallas</figcaption></figure>`;
  $('#modalContent').innerHTML=`<div class="modal-grid"><div class="modal-gallery">${gallery()}</div><div class="modal-details"><p class="eyebrow">${product.category.toUpperCase()} · ${product.id}</p><h2 id="modalTitle">${product.name}</h2><strong class="modal-price">${money(product.price)}</strong><p class="trust-note">🚚 Envío gratis a partir de 2 camisetas · ✓ Calidad premium: si no te convence, te devolvemos el dinero.</p><dl><div><dt>Temporada</dt><dd>${product.season}</dd></div><div><dt>Marca</dt><dd>${product.brand}</dd></div><div><dt>Liga</dt><dd>${product.league}</dd></div><div><dt>Disponibilidad</dt><dd>${product.available}</dd></div></dl><fieldset><legend>Talla</legend>${product.sizes.map(size=>`<button class="size ${size==='M'?'selected':''}">${size}</button>`).join('')}</fieldset><button id="guideToggle" class="size-guide-toggle">Guía de tallas +</button>${guide()}${version}<a id="consultInstagram" class="instagram" href="https://ig.me/m/${INSTAGRAM_USER}" target="_blank" rel="noopener">Consultar por Instagram <span>↗</span></a><p class="consult-note">Al abrir Instagram se copiará tu pedido para que solo tengas que pegarlo y enviarlo.</p></div></div><section class="related"><div class="related__heading"><p class="eyebrow">SELECCIONADAS PARA TI</p><h3>También te puede gustar</h3></div><div class="related-products">${related.map(item=>`<button data-product="${item.id}"><img src="${item.images[0].src}" alt="${item.name}"><span>${item.name}</span><small>${item.category} · ${item.season}</small><strong>${money(item.price)}</strong></button>`).join('')}</div></section>`;
  const bindModal=()=>{
    if(!$('.patch-selector')){const patches=availablePatches(product);const patchField=document.createElement('fieldset');patchField.className='patch-selector';patchField.innerHTML=`<legend>Parche</legend><div class="patch-options">${patches.map(patch=>`<button class="${patch==='Sin parche'?'selected':''}" data-patch="${patch}">${patch}</button>`).join('')}</div>`;$('#consultInstagram').before(patchField)}$$('[data-patch]').forEach(button=>button.onclick=()=>{selectedPatch=button.dataset.patch;$$('[data-patch]').forEach(item=>item.classList.toggle('selected',item===button))});
    $$('.size').forEach(button=>button.onclick=()=>{$$('.size').forEach(item=>item.classList.remove('selected'));button.classList.add('selected');selectedSize=button.textContent});
    $$('[data-type]').forEach(button=>button.onclick=()=>{selectedType=button.dataset.type;$$('[data-type]').forEach(item=>item.classList.toggle('selected',item===button));$('#typeHint').textContent=selectedType==='Fan'?'Corte clásico, cómodo para el uso diario y con excelente relación calidad-precio.':'La misma versión utilizada por los futbolistas profesionales, con tejido más ligero, transpirable y ajuste deportivo.'});
    $$('[data-gallery-index]').forEach(button=>button.onclick=()=>{photoIndex=Number(button.dataset.galleryIndex);$('.modal-gallery').innerHTML=gallery();bindModal()});
    $('#galleryMain').onclick=()=>$('.gallery__main').classList.toggle('zoomed');
    $('#guideToggle').onclick=()=>{let guideDialog=$('#sizeGuideModal');if(!guideDialog){guideDialog=document.createElement('dialog');guideDialog.id='sizeGuideModal';guideDialog.className='size-guide-modal';document.body.append(guideDialog);guideDialog.addEventListener('click',event=>{if(event.target===guideDialog)guideDialog.close()})}guideDialog.innerHTML='<button class="size-guide-modal__close" aria-label="Cerrar guia de tallas">&times;</button><img src="tabla.png" alt="Tabla de tallas de camisetas de futbol para hombre">';guideDialog.querySelector('button').onclick=()=>guideDialog.close();guideDialog.showModal()};
    $('#consultInstagram').onclick=()=>{const type=product.isRetro?'Retro':selectedType;const message=`Hola FutGonZ, quiero consultar esta camiseta:\n\nProducto: ${product.name}\nReferencia: ${product.id}\nCategoría: ${product.category}\nEquipo: ${product.team}\nTemporada: ${product.season}\nTipo: ${type}\nTalla: ${selectedSize}\nPrecio: ${money(product.price)}\n\n¿La tenéis disponible?`;copyText(message).then(()=>toast('Pedido copiado. Pégalo en el chat de Instagram y envíalo.'))};
    $('#consultInstagram').onclick=()=>{const type=product.isRetro?'Retro':selectedType;const message=`Hola FutGonZ, quiero consultar esta camiseta:\n\nProducto: ${product.name}\nReferencia: ${product.id}\nCategoria: ${product.category}\nEquipo: ${product.team}\nTemporada: ${product.season}\nTipo: ${type}\nTalla: ${selectedSize}\nParche: ${selectedPatch}\nPrecio: ${money(product.price)}\n\nLa teneis disponible?`;copyText(message).then(()=>toast('Pedido copiado. Pegalo en el chat de Instagram y envialo.'))};
    $$('[data-product]').forEach(button=>button.onclick=()=>openModal(PRODUCTOS.find(item=>item.id===button.dataset.product)));
  };bindModal();dialog.showModal();
}
function addOptions(id,key){const select=$('#'+id),values=[...new Set(PRODUCTOS.map(product=>product[key]))].sort();select.insertAdjacentHTML('beforeend',values.map(value=>`<option>${value}</option>`).join(''))}
[['leagueFilter','league'],['teamFilter','team'],['seasonFilter','season'],['brandFilter','brand']].forEach(pair=>addOptions(...pair));
$('#popularGrid').replaceChildren(...PRODUCTOS.filter(product=>product.popular).map(card));
['search','typeFilter','categoryFilter','leagueFilter','teamFilter','seasonFilter','brandFilter','stockFilter'].forEach(id=>$('#'+id).addEventListener('input',()=>{visibleProducts=30;render()}));
$('#filterButton').onclick=()=>{const filters=$('#filters'),show=filters.hidden;filters.hidden=!show;$('#filterButton').setAttribute('aria-expanded',show);$('#filterButton span').textContent=show?'−':'+'};
$('#clearFilters').onclick=()=>{$$('#filters select').forEach(select=>select.value='');$('#search').value='';visibleProducts=30;render()};
$('#favoritesToggle').onclick=()=>{showingFavorites=!showingFavorites;visibleProducts=30;$('.favorites-label').textContent=showingFavorites?'Volver al catalogo':'Mis favoritos';$('#favoritesCount').hidden=showingFavorites;render();location.hash='catalogo'};$('#loadMore').onclick=()=>{visibleProducts+=30;render()};
$('#closeModal').onclick=()=>$('#productModal').close();$('#productModal').addEventListener('click',event=>{if(event.target===$('#productModal'))$('#productModal').close()});
$('#favoritesToggle').innerHTML='<span class="favorites-icon" aria-hidden="true">&hearts;</span><span class="favorites-label">Mis favoritos</span><span id="favoritesCount">0</span>';
$$('footer nav a[href="#"]').forEach(link=>link.remove());
$('#year').textContent=new Date().getFullYear();saveFavorites();render();