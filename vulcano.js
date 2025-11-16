let table;
let volcano = null;
let worldImg;

//carichiamo csv e mappa
function preload() {
  table = loadTable("data.csv", "csv", "header");
  worldImg = loadImage("mondo.jpg");
}

function setup() {
  noLoop();

  const params = new URLSearchParams(window.location.search);
  const name = params.get("v");

  if (!name) {
    document.getElementById("v-name").innerText = "Vulcano non trovato"; //mostra messaggio se nessun parametro
    return;
  }

  findVolcano(name); //cerca il vulcano nel csv

  if (!volcano) {
    document.getElementById("v-name").innerText = "Vulcano non trovato"; //mostra messaggio se vulcano non trovato
    return;
  }

  document.getElementById("v-name").innerText = volcano["Volcano Name"]; //aggiorna l'HTML con il nome del vulcano

  drawElevationSketch(); //creo il canvas per il grafico dell'elevazione 
  drawMapSketch(); //creo il canvas per la mini mappa 
  showInfo(); //mostra le info dettagliate nel box sotto
}

//cerco vulcano nel csv
function findVolcano(name) {
  const search = name.toLowerCase().trim();

  for (let r = 0; r < table.getRowCount(); r++) { //ciclo tutte le righe del CSV
    const row = table.getRow(r);

    const csvName = row.get("Volcano Name"); //prende il nome dalla colonna
    if (!csvName) continue;  //salta righe vuote

    if (csvName.toLowerCase().trim() === search) {
      volcano = row.obj;
      return;
    }
  }
}

//ho dovuto lavorare in instance mode e non in global mode perchè 
//volevo avere più canvas separati inseriti in div HTML diversi,
//ciascuno con il proprio contenuto e layout.
//se avessi fatto tutto in global mode, 
//triangolo e mappa finivano nello stesso canvas, 
//e non riuscivo a inserirli separatamente nei due box

//grafico elevation
function drawElevationSketch() {
  let elevationSketch = (p) => { //canvas dentro #elevation-canvas

    p.setup = () => {
      let cnv = p.createCanvas(300, 200); //creo canvas
      cnv.parent("elevation-canvas")//inserisco il canvas nel div specifico
    };

    p.draw = () => {
      p.background(255); //sfondo bianco

      let h = Number(volcano["Elevation (m)"]); //prende l'altezza dal CSV
      let maxHeight = 150;//altezza max del triangolo
      let scaled = p.map(h, 0, 6000, 0, maxHeight); //scala l'altezza proporzionalmente

      //triangolo elevation
      p.fill(255, 80, 50); //colore rosso
      p.noStroke()//nessun bordo

      p.triangle(
        120, 180, //vertice base centro
        50, 180, //vertice base sinistra
        120, 180 - scaled //punta triangolo proporzionale all'altezza
      );

      //scala altezza vulcano
      let barX = 220; //posizione orizzontale della barra
      let barTop = 30; //inizio barra
      let barBottom = 180; //fine barra
      let barHeight = barBottom - barTop; //altezza barra

      p.stroke(0); 
      p.strokeWeight(3);
      p.line(barX, barTop, barX, barBottom);

      //tacche ogni 1000 m
      p.strokeWeight(1); //linea più sottile
      p.fill(0); //testo nero
      p.textSize(10); //dimensione testo

      for (let i = 0; i <= 6000; i += 1000) { //ciclo tacche ogni 1000 m
        let y = p.map(i, 0, 6000, barBottom, barTop); //posizione verticale

        p.line(barX - 6, y, barX + 6, y); //disegna tacca
        p.noStroke();
        p.text(i + " m", barX + 10, y + 3); //scrive valore vicino alla tacca
        p.stroke(0);
      }

    //testo altitudine
      document.getElementById("elevation-label").innerHTML =
        `<b>Altitudine:</b> ${h} m`; //aggiorna il div HTML con l'altezza

      p.noLoop();
    };
  };

  new p5(elevationSketch); //crea una nuova istanza p5 (uso instance mode)
}

//posizione vulcano nella mappa
function drawMapSketch() {
  let mapSketch = (p) => { //ho dovuto creare un'istanza p5 separata per la mappa

    p.setup = () => {
      let cnv = p.createCanvas(300, 200); //canvas della mappa
      cnv.parent("map-canvas"); //inserisco canvas nel div corretto
    };

    p.draw = () => {
      p.image(worldImg, 0, 0, 300, 200); //disegno la mappa

      const lat = Number(volcano.Latitude); //latitudine vulcano
      const lon = Number(volcano.Longitude); //longitudine vulcano

      const x = p.map(lon, -180, 180, 0, 300); //trasforma lon in coordinata canvas
      const y = p.map(lat, 90, -90, 0, 200); //trasforma lat in coordinata canvas

      p.fill(255, 0, 0); //punto rosso per posizione vulcano
      p.noStroke();
      p.ellipse(x, y, 12, 12); //disegno punto

      document.getElementById("coords").innerHTML =
        `<b>Latitudine:</b> ${lat} — <b>Longitudine:</b> ${lon}`; //aggiorna HTML

      p.noLoop();
    };
  };

  new p5(mapSketch); //crea istanza p5 per la mappa (uso instance mode)
}

//ultimo box con tutti gli altri dettagli e informazioni
function showInfo() {
  const box = document.getElementById("big-info-box"); //seleziona il div HTML

  box.innerHTML = `
    <h2>Dettagli</h2>
    <div class="info-line"><b>Volcano Number:</b> ${volcano["Volcano Number"]}</div>
    <div class="info-line"><b>Country:</b> ${volcano.Country}</div>
    <div class="info-line"><b>Location:</b> ${volcano.Location}</div>
    <div class="info-line"><b>Type:</b> ${volcano.Type}</div>
    <div class="info-line"><b>Type Category:</b> ${volcano.TypeCategory}</div>
    <div class="info-line"><b>Status:</b> ${volcano.Status}</div>
    <div class="info-line"><b>Last Known Eruption:</b> ${volcano["Last Known Eruption"]}</div>
  `; //scrive tutti i dettagli del vulcano nel div HTML
}
