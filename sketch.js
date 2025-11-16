// File della mappa e CSV
const MAP_FILE = "mondo.jpg";
const CSV_FILE = "data.csv";

let worldImg, table;// immagine della mappa e dati CSV
let volcanoes = [];// array di vulcani
let cnv, wrapper;// canvas e wrapper HTML
let selected = null;// vulcano selezionato

function openVolcanoPage(name) {
  if (!name) return;

  const encoded = encodeURIComponent(name);

  // Apri la pagina dedicata con parametro GET ?v=Nome
  window.location.href = `vulcano.html?v=${encoded}`;
}


// carico i vari file
function preload() {
  // mappa
  worldImg = loadImage(MAP_FILE,);

  // CSV
  table = loadTable(CSV_FILE, "csv", "header");
}


function setup() {
  wrapper = document.getElementById("canvas-wrapper");   // prendo il contenitore creato in HTML dove mettere il canvas
  if (!wrapper) {
// se il contenitore non c'è, crea un canvas piccolo di default
    createCanvas(640, 360);
    return;
  }

  createResponsiveCanvas();// canvas responsivo
  imageMode(CORNER);// disegno immagine da angolo in alto a sinistra
  textFont("Poppins");// font Poppins per testi
  noStroke();

  // se il CSV è caricato e ha righe
  if (table && table.getRowCount() > 0) {
    loadVolcanoData();// prendi i dati e mettili nell'array volcanoes
    createVolcanoList();
  } else {
    showOverlay("Avviso: CSV vuoto o non caricato."); // altrimenti mostra avviso
  }

  // quando la finestra cambia dimensione
  window.addEventListener("resize", () => {
    createResponsiveCanvas(); // ridimensiona il canvas
    redrawAll(); // ridisegna tutto
  });

  redrawAll(); // disegna tutto una volta all'inizio
}

// per avere un canvas responsivo
function createResponsiveCanvas() {
  const wrapperW = wrapper.clientWidth || 600; // prendi la larghezza del contenitore
  const imgRatio = worldImg && worldImg.width ? worldImg.width / worldImg.height : 16/9; // rapporto larghezza/altezza
  const desiredW = wrapperW; // larghezza canvas = larghezza wrapper
  const desiredH = Math.round(desiredW / imgRatio); // altezza canvas proporzionata

  if (cnv) resizeCanvas(desiredW, desiredH); // se esiste già il canvas ridimensionalo
  else {
    cnv = createCanvas(desiredW, desiredH); // altrimenti creane uno nuovo
    cnv.parent(wrapper); // mettilo dentro il wrapper HTML
  }
}

// prende i dati dal CSV e li trasforma in oggetti vulcano
function loadVolcanoData() {
  volcanoes = []; // svuota l'array prima di riempirlo
  for (let r = 0; r < table.getRowCount(); r++) {
    let name = table.getString(r, "Volcano Name") || "Sconosciuto"; // nome del vulcano
    let lat = parseFloat(table.getString(r, "Latitude").replace(",", ".")) || 0;// latitudine
    let lon = parseFloat(table.getString(r, "Longitude").replace(",", ".")) || 0; // longitudine
    let elev = parseFloat(table.getString(r, "Elevation (m)").replace(",", ".")) || 0; // altezza

    // calcolo dimensione del triangolo in base all'elevazione
    let size = map(constrain(elev, -6000, 7000), -6000, 7000, 6, 15);
    volcanoes.push({ name, lat, lon, elev, size: constrain(size, 6, 20) }); // metti tutto nell'array
  }
}

// ciclo principale di disegno
function draw() {
  clear(); // cancella il canvas
  background(10); // sfondo scuro

  if (worldImg) image(worldImg, 0, 0, width, height); // disegna mappa
  else { fill(30); rect(0, 0, width, height); } // se manca mappa, fai rettangolo grigio

  let hovered = null; // vulcano sotto il mouse (hover)

  // disegna ogni vulcano
  for (let v of volcanoes) {
    const p = projectToPixel(v.lon, v.lat); // posizione sul canvas
    const d = dist(mouseX, mouseY, p.x, p.y); // distanza mouse vulcano
    const isHovered = d < v.size * 1.2; // controllo se il mouse è sopra
    const isSelected = selected && selected.name === v.name;

    if (isHovered) hovered = { ...v, x: p.x, y: p.y }; // salva vulcano hover

    drawVolcanoTriangle(p.x, p.y, v.size, v.elev, isHovered || isSelected); // disegna triangolo
  }

  // cambio cursore se hovering
  if (hovered) cursor("pointer"); else cursor("default");

  // mostra info box se vulcano selezionato
  if (selected) drawInfoBox(selected);
}

// disegna singolo triangolo vulcano
function drawVolcanoTriangle(x, y, baseSize, elevation, highlight) {
  push(); // salva stato disegno
  translate(x, y); // sposta il punto 0,0 sul vulcano
  noStroke();

  colorMode(HSB, 360, 100, 100); // usa HSB per colore
  const lowColor = color(30, 100, 100);   // arancio chiaro per vulcani bassi
  const highColor = color(30, 100, 40);   // arancio scuro per vulcani alti

  // interpolazione colore in base all'elevazione
  const t = map(constrain(elevation, -6000, 7000), -6000, 7000, 0, 1); // quanto scuro deve essere
  let fillColor = lerpColor(lowColor, highColor, t); // colore finale
  fill(fillColor); // applica colore

// torna a RGB
  colorMode(RGB, 255, 255, 255);

// se hover, ingrandisci
  const size = highlight ? baseSize * 1.5 : baseSize;

// alone luminoso se hover
  if (highlight) {
    drawingContext.shadowBlur = 20;
    drawingContext.shadowColor = "rgba(255,200,120,0.7)";
  } else {
    drawingContext.shadowBlur = 0;
  }

  // disegna triangolo
  beginShape();
    vertex(0, -size / 1.3);
    vertex(-size / 2, size / 2);
    vertex(size / 2, size / 2);
  endShape(CLOSE);

  drawingContext.shadowBlur = 0;
  pop();
}

// disegno box informativo del vulcano selezionato
function drawInfoBox(v) {
  push();
  textAlign(LEFT, TOP); // testo in alto a sinistra
  textSize(14); // dimensione testo
  textFont("Helvetica"); // font

  const lines = [
    `🌋 ${v.name}`, // nome vulcano
    `Elevation: ${v.elev} m` // altezza
  ];
  const padding = 12; // margine dentro box

// calcolo dimensione box
  let maxTextWidth = 0;
  for (let line of lines) {
    const w = textWidth(line);
    if (w > maxTextWidth) maxTextWidth = w;
  }

  const boxW = maxTextWidth + padding * 2; // larghezza box
  const boxH = lines.length * 16 + padding * 2; // altezza box

  // posizione box vicino al vulcano senza uscire dai bordi
  let bx = (v.x + boxW + 20 > width) ? v.x - boxW - 20 : v.x + 20;
  let by = (v.y + boxH + 20 > height) ? v.y - boxH - 20 : v.y + 20;
  bx = constrain(bx, 12, width - boxW - 12);
  by = constrain(by, 12, height - boxH - 12);

  // disegno box
  fill(0, 200); // colore sfondo box
  stroke("#FE820A"); // colore bordo
  strokeWeight(2); // spessore bordo
  rect(bx, by, boxW, boxH, 8); // disegno rettangolo

  // testo all'interno del bix
  noStroke();
  fill(255); // testo bianco
  for (let i = 0; i < lines.length; i++) {
    text(lines[i], bx + padding, by + padding + i * 16); //scrivi testo
  }

  pop();
}

// creo una legenda esterna sotto il canvas
function createLegend() {
  const legendDiv = document.getElementById("legend"); // prendi div legenda da HTML
  if (!legendDiv) return;
// metti contenuto HTML dentro il div
  legendDiv.innerHTML = `
    <strong>Legenda:</strong>
    <ul>
      <li>Clicca su un vulcano per ulteriori info.</li>
      <li>Colore: più scuro = vulcano più alto, più chiaro = più basso.</li>
      <li>Grandezza triangolo: proporzionale all'elevazione.</li>
    </ul>
  `;
}

// chiamo la funzione per creare la legenda
createLegend();

function createVolcanoList() {
  const listDiv = document.getElementById("volcano-list");
  const searchBar = document.getElementById("search-bar");
  if (!listDiv) return;

  function renderList(filter = "") {
    listDiv.innerHTML = "";

    const filtered = volcanoes.filter(v =>
      v.name.toLowerCase().includes(filter.toLowerCase())
    );

    filtered.forEach(v => {
      const elem = document.createElement("div");
      elem.className = "vulcano-card";
      elem.dataset.name = v.name;

      elem.innerHTML = `
        <span>🌋 ${v.name}</span><br>
        <small>${v.elev} m</small>
      `;

      elem.addEventListener("click", () => {
        openVolcanoPage(v.name);
      });

      listDiv.appendChild(elem);
    });
  }

  // render iniziale
  renderList();

  // filtro dinamico
  searchBar.addEventListener("input", () => {
    renderList(searchBar.value);
  });

  // scroll con bottoni
  document.getElementById("scroll-left").onclick = () => {
    listDiv.scrollBy({ left: -200, behavior: "smooth" });
  };

  document.getElementById("scroll-right").onclick = () => {
    listDiv.scrollBy({ left: 200, behavior: "smooth" });
  };
}


// quando clicco sul canvas in giro
function mousePressed() {
  if (!cnv) return;

  for (let v of volcanoes) {
    const p = projectToPixel(v.lon, v.lat);
    if (dist(mouseX, mouseY, p.x, p.y) < v.size * 1.5) {
      openVolcanoPage(v.name);
      return;
    }
  }
}


// trasforma latitudine/longitudine in pixel sul canvas
function projectToPixel(lon, lat) {
  const x = map(lon, -180, 180, 0, width);
  const y = map(lat, 90, -90, 0, height);
  return { x, y };
}

// quando la finestra cambia dimensione
function windowResized() {
  createResponsiveCanvas();
  redrawAll();
}

// ridisegna tutto
function redrawAll() { redraw(); }
