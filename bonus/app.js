let stations = [], mode = "hex", commune = "", weight = "bikes", deckgl;
let view = { longitude: 4.842, latitude: 45.755, zoom: 12, pitch: 50, bearing: -18 };
const hexColors = [[13,42,55],[16,86,96],[20,140,128],[78,190,118],[170,225,70],[250,210,80]];
const $ = id => document.getElementById(id);

function weightOf(s) {
  if (weight === "electrical") return s.total_stands.availabilities.electricalBikes;
  if (weight === "mechanical") return s.total_stands.availabilities.mechanicalBikes;
  return s.available_bikes;
}

function fillColor(s) {
  let r = s.bike_stands ? s.available_bikes / s.bike_stands : 0;
  return r < 0.05 ? [255,70,70] : r < 0.5 ? [255,200,70] : [120,220,90];
}

const getData = () => commune ? stations.filter(s => s.commune === commune) : stations;

function getTooltip({ object: s }) {
  if (!s) return null;
  let html = s.points
    ? s.points.length + " stations"
    : `<b>${s.name}</b><br>${s.commune}<br>${s.available_bikes} vélos, ${s.available_bike_stands} bornes libres`;
  return { html, className: "tip" };
}

function makeLayers() {
  let data = getData(), getPosition = s => [s.lng, s.lat];
  if (mode === "heat")
    return [new deck.HeatmapLayer({ data, getPosition, getWeight: weightOf, radiusPixels: 60 })];
  if (mode === "scatter")
    return [new deck.ScatterplotLayer({ data, getPosition, getFillColor: fillColor, pickable: true,
      getRadius: s => Math.sqrt(s.bike_stands || 1) * 9, radiusMinPixels: 3, radiusMaxPixels: 30 })];
  return [new deck.HexagonLayer({ data, getPosition, pickable: true,
    getColorWeight: weightOf, getElevationWeight: weightOf, colorAggregation: "SUM",
    elevationAggregation: "SUM", radius: 230, elevationScale: 7, extruded: true, colorRange: hexColors })];
}

const draw = () => deckgl.setProps({ layers: makeLayers() });

function updateStats() {
  let data = getData(), bikes = 0, capacity = 0;
  for (let s of data) { bikes += s.available_bikes; capacity += s.bike_stands; }
  $("nStations").textContent = data.length;
  $("nBikes").textContent = bikes;
  $("nFill").textContent = Math.round(bikes / capacity * 100) + "%";
}

function updateLegend() {
  $("legend").innerHTML = mode === "scatter"
    ? `<div><span style="background:rgb(255,70,70)"></span>Station vide</div>
       <div><span style="background:rgb(255,200,70)"></span>Moitié pleine</div>
       <div><span style="background:rgb(120,220,90)"></span>Station pleine</div>`
    : `<div>Peu <span style="width:120px;background:linear-gradient(90deg,${hexColors.map(c => `rgb(${c})`)})"></span> Beaucoup</div>`;
}

function buttons(attr, set) {
  let group = document.querySelectorAll(`[data-${attr}]`);
  group.forEach(b => b.onclick = () => {
    group.forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    set(b.dataset[attr]);
  });
}
const flyTo = v => deckgl.setProps({ initialViewState: view = { ...view, ...v, transitionDuration: 700 } });

buttons("mode", v => { mode = v; updateLegend(); draw(); });
buttons("weight", v => { weight = v; draw(); });
$("commune").onchange = e => {
  commune = e.target.value; updateStats(); draw();
  let d = getData();
  if (d.length) flyTo({
    longitude: d.reduce((a, s) => a + s.lng, 0) / d.length,
    latitude: d.reduce((a, s) => a + s.lat, 0) / d.length,
    zoom: commune ? 13 : 12
  });
};
$("map").onclick = e => e.ctrlKey && flyTo({ pitch: view.pitch ? 0 : 60 });

fetch("velov2026.json").then(r => r.text()).then(text => {
  stations = text.trim().split("\n").map(l => JSON.parse(l)).filter(s => s.lat && s.lng);

  [...new Set(stations.map(s => s.commune))].sort()
    .forEach(name => $("commune").add(new Option(name, name)));
  updateStats();
  updateLegend();

  deckgl = new deck.DeckGL({
    container: "map",
    map: maplibregl,
    mapStyle: "https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json",
    initialViewState: view,
    controller: true,
    onViewStateChange: e => view = e.viewState,
    getTooltip,
    layers: makeLayers()
  });
});
