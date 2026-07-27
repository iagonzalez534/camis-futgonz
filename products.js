/*
  ÚNICO ARCHIVO DE PRODUCTOS.
  Añade una camiseta moderna: moderna('Nombre','Equipo','Club o Selección','Liga','País','2026/27','Marca')
  Añade una retro: retro('Nombre','Equipo','Club o Selección','Liga','País','2010','Marca')
  El último valor opcional marca un producto como popular: true.
*/
const imagePool=['1579952363873-27f3bade9f55','1526232761682-d26e03ac148e','1517466787929-bc90951d0974','1551958219-acbc608c6377','1518091043644-c1d4457512c6','1508098682722-e99c43a406b2'];
let nextId=1;
function product(name,team,category,league,country,season,brand,isRetro=false,available=true,popular=false){
  const id=`FG-${String(nextId++).padStart(3,'0')}`;
  const imageIndex=(nextId-2)%imagePool.length;
  const photos=[imagePool[imageIndex],imagePool[(imageIndex+1)%imagePool.length]].map((photo,index)=>({src:`https://images.unsplash.com/photo-${photo}?auto=format&fit=crop&w=1200&h=1500&q=86`,alt:`${name}, ${index===0?'vista principal':'detalle'}`}));
  return {id,name,team,category,league,country,season,brand,isRetro,type:isRetro?'Retro':'Fan / Jugador',available:available?'Disponible':'Próximamente',sizes:['S','M','L','XL','2XL','3XL','4XL'],price:isRetro?39.95:32.95,image:photos[0].src,images:photos,popular};
}
const moderna=(name,team,category,league,country,season,brand,available=true,popular=false)=>product(name,team,category,league,country,season,brand,false,available,popular);
const retro=(name,team,category,league,country,season,brand,available=true,popular=false)=>product(name,team,category,league,country,season,brand,true,available,popular);

let PRODUCTOS=[
  moderna('Real Madrid 26/27','Real Madrid','Club','LaLiga','España','2026/27','Adidas',true,true),
  moderna('FC Barcelona 26/27','FC Barcelona','Club','LaLiga','España','2026/27','Nike',true,true),
  moderna('España 2026 Local · Dos estrellas','España','Selección','Internacional','España','2026','Adidas',true,true),
  moderna('España 2026 Visitante · Dos estrellas','España','Selección','Internacional','España','2026','Adidas',true,true),
  moderna('Atlético de Madrid 26/27','Atlético de Madrid','Club','LaLiga','España','2026/27','Nike',false),
  moderna('Sevilla 26/27','Sevilla','Club','LaLiga','España','2026/27','Adidas'),
  moderna('Valencia 26/27','Valencia','Club','LaLiga','España','2026/27','Puma'),
  moderna('Athletic Club 26/27','Athletic Club','Club','LaLiga','España','2026/27','Castore'),
  moderna('Real Sociedad 26/27','Real Sociedad','Club','LaLiga','España','2026/27','Macron'),
  moderna('Manchester City 26/27','Manchester City','Club','Premier League','Inglaterra','2026/27','Puma'),
  moderna('Manchester United 26/27','Manchester United','Club','Premier League','Inglaterra','2026/27','Adidas'),
  moderna('Liverpool 26/27','Liverpool','Club','Premier League','Inglaterra','2026/27','Adidas'),
  moderna('Arsenal 26/27','Arsenal','Club','Premier League','Inglaterra','2026/27','Adidas'),
  moderna('Chelsea 26/27','Chelsea','Club','Premier League','Inglaterra','2026/27','Nike'),
  moderna('Tottenham 26/27','Tottenham','Club','Premier League','Inglaterra','2026/27','Nike'),
  moderna('AC Milan 26/27','AC Milan','Club','Serie A','Italia','2026/27','Puma'),
  moderna('Inter 26/27','Inter','Club','Serie A','Italia','2026/27','Nike'),
  moderna('Juventus 26/27','Juventus','Club','Serie A','Italia','2026/27','Adidas'),
  moderna('Roma 26/27','Roma','Club','Serie A','Italia','2026/27','Adidas'),
  moderna('Napoli 26/27','Napoli','Club','Serie A','Italia','2026/27','EA7'),
  moderna('Bayern 26/27','Bayern München','Club','Bundesliga','Alemania','2026/27','Adidas'),
  moderna('Dortmund 26/27','Borussia Dortmund','Club','Bundesliga','Alemania','2026/27','Puma'),
  moderna('Bayer Leverkusen 26/27','Bayer Leverkusen','Club','Bundesliga','Alemania','2026/27','Castore'),
  moderna('PSG 26/27','Paris Saint-Germain','Club','Ligue 1','Francia','2026/27','Nike'),
  moderna('Marseille 26/27','Marseille','Club','Ligue 1','Francia','2026/27','Puma'),
  moderna('Lyon 26/27','Lyon','Club','Ligue 1','Francia','2026/27','Adidas'),
  moderna('Benfica 26/27','Benfica','Club','Liga Portugal','Portugal','2026/27','Adidas'),
  moderna('Porto 26/27','Porto','Club','Liga Portugal','Portugal','2026/27','New Balance'),
  moderna('Sporting 26/27','Sporting CP','Club','Liga Portugal','Portugal','2026/27','Nike'),
  moderna('Argentina 2024','Argentina','Selección','Internacional','Argentina','2024','Adidas'),
  moderna('Brasil 2024','Brasil','Selección','Internacional','Brasil','2024','Nike'),
  moderna('Francia 2024','Francia','Selección','Internacional','Francia','2024','Nike'),
  moderna('Alemania 2024','Alemania','Selección','Internacional','Alemania','2024','Adidas'),
  moderna('Portugal 2024','Portugal','Selección','Internacional','Portugal','2024','Nike'),
  moderna('Inglaterra 2024','Inglaterra','Selección','Internacional','Inglaterra','2024','Nike'),
  moderna('Italia 2024','Italia','Selección','Internacional','Italia','2024','Adidas'),
  moderna('Países Bajos 2024','Países Bajos','Selección','Internacional','Países Bajos','2024','Nike'),
  moderna('Bélgica 2024','Bélgica','Selección','Internacional','Bélgica','2024','Adidas'),
  moderna('Croacia 2024','Croacia','Selección','Internacional','Croacia','2024','Nike'),
  moderna('Uruguay 2024','Uruguay','Selección','Internacional','Uruguay','2024','Nike'),
  moderna('México 2024','México','Selección','Internacional','México','2024','Adidas'),
  moderna('Japón 2024','Japón','Selección','Internacional','Japón','2024','Adidas'),
  moderna('Marruecos 2024','Marruecos','Selección','Internacional','Marruecos','2024','Puma'),
  retro('Real Madrid 2010','Real Madrid','Club','LaLiga','España','2010','Adidas')
];

// Mientras se preparan las fotos definitivas, todo el catalogo muestra los dos avisos locales.
PRODUCTOS=PRODUCTOS.filter(product=>!product.isRetro);
PRODUCTOS.forEach(product=>{
  product.available='Pr\u00f3ximamente';
  product.images=[
    {src:'prox.png',alt:`${product.name}, proximamente`},
    {src:'proxim.png',alt:`${product.name}, imagen pendiente de actualizar`}
  ];
  product.image=product.images[0].src;
});

PRODUCTOS.slice(0,4).forEach(product=>{
  product.images=[
    {src:`${product.id}-D.webp`,alt:`${product.name}, vista delantera`},
    {src:`${product.id}-A.webp`,alt:`${product.name}, vista trasera`}
  ];
  product.image=product.images[0].src;
  product.available='Disponible';
});

PRODUCTOS.forEach(product=>{
  if(product.category==='Selecci\u00f3n'&&product.season==='2024'){
    product.season='2026';
    product.name=product.name.replace('2024','2026');
  }
  product.name=product.name.replace(/Visitante/gi,'2\u00aa equipaci\u00f3n');
});

function addUpcoming(name,team,category,league,country,season,brand,isRetro=false){
  if(PRODUCTOS.some(product=>product.name===name))return;
  const item=isRetro?retro(name,team,category,league,country,season,brand):product(name,team,category,league,country,season,brand);
  item.available='Pr\u00f3ximamente';
  item.images=[{src:'prox.png',alt:`${name}, proximamente`},{src:'proxim.png',alt:`${name}, imagen pendiente de actualizar`}];
  item.image=item.images[0].src;
  PRODUCTOS.push(item);
}
addUpcoming('Colombia 2026','Colombia','Selecci\u00f3n','Internacional','Colombia','2026','Adidas');
addUpcoming('Argentina 2026 2\u00aa equipaci\u00f3n','Argentina','Selecci\u00f3n','Internacional','Argentina','2026','Adidas');
addUpcoming('Real Madrid 26/27 2\u00aa equipaci\u00f3n','Real Madrid','Club','LaLiga','Espa\u00f1a','2026/27','Adidas');
addUpcoming('FC Barcelona 26/27 2\u00aa equipaci\u00f3n','FC Barcelona','Club','LaLiga','Espa\u00f1a','2026/27','Nike');
addUpcoming('Venezuela 2026','Venezuela','Selecci\u00f3n','Internacional','Venezuela','2026','Puma');
addUpcoming('Boca Juniors 26/27','Boca Juniors','Club','Liga Profesional Argentina','Argentina','2026/27','Adidas');
addUpcoming('River Plate 26/27','River Plate','Club','Liga Profesional Argentina','Argentina','2026/27','Adidas');
addUpcoming('AC Milan Retro 2006/07','AC Milan','Club','Serie A','Italia','2006/07','Adidas',true);

// Camisetas con fotos ya subidas: se marcan Disponible y usan sus fotos reales (ID-D.webp / ID-A.webp).
const CAMISETAS_LISTAS=['Argentina 2026','Argentina 2026 2\u00aa equipaci\u00f3n','M\u00e9xico 2026','Colombia 2026','Venezuela 2026','River Plate 26/27','AC Milan Retro 2006/07','Atl\u00e9tico de Madrid 26/27','Sevilla 26/27'];
PRODUCTOS.filter(product=>CAMISETAS_LISTAS.includes(product.name)).forEach(product=>{
  product.images=[
    {src:`${product.id}-D.webp`,alt:`${product.name}, vista delantera`},
    {src:`${product.id}-A.webp`,alt:`${product.name}, vista trasera`}
  ];
  product.image=product.images[0].src;
  product.available='Disponible';
});
// Las camisetas ya listas (con foto propia) se muestran primero en el catálogo;
// el resto (aún con las imágenes "Próximamente") queda detrás, sin perder su orden entre sí.
PRODUCTOS.sort((a,b)=>(a.available==='Disponible'?0:1)-(b.available==='Disponible'?0:1));