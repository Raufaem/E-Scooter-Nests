// Initialize map centered on Oshawa
const map = L.map('map').setView([43.9, -78.86], 12);

// Default base layer: OpenStreetMap
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Satellite imagery layer (Esri)
const esriSat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/' +
  'World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, etc.'
});

// Layer toggle
const baseMaps = {
  "OpenStreetMap (default)": osm,
  "Satellite": esriSat
};

L.control.layers(baseMaps).addTo(map);


// Marker cluster group
const markerClusterGroup = L.markerClusterGroup({
  maxClusterRadius: 1,
  spiderfyDistanceMultiplier: 1
});
map.addLayer(markerClusterGroup);

let allData = [];

// Load Oshawa boundary GeoJSON and add to map
fetch('oshawa_boundary.geojson')
  .then(res => res.json())
  .then(data => {
    const oshawaOnly = {
      type: "FeatureCollection",
      features: data.features.filter(f => f.properties.NAME === "Oshawa")
    };

    L.geoJSON(oshawaOnly, {
      style: {
        color: "#0000ff",
        weight: 2,
        fillColor: "#0000ff",
        fillOpacity: 0.1
      }
    }).addTo(map);
  });

// Load new CSV data using PapaParse
Papa.parse('escooters_.csv', {
  header: true,
  download: true,
  complete: (results) => {
    allData = results.data.filter(row => row.latitude && row.longitude);
    updateMap(allData);
  }
});

// Update map markers
function updateMap(data) {
  markerClusterGroup.clearLayers();

  data.forEach(row => {
    const lat = parseFloat(row.latitude);
    const lon = parseFloat(row.longitude);
    if (isNaN(lat) || isNaN(lon)) return;

    // Single marker style/color (e.g., blue)
    const marker = L.marker([lat, lon], {
      icon: L.divIcon({
        className: 'custom-icon',
        html: `<div style="
          background: teal;
          border: 1px solid black;
          border-radius: 50%;
          width: 12px;
          height: 12px;
          opacity: 0.85;
        "></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      })
    }).bindPopup(`
      <div style="font-size: 13px; font-family: sans-serif;">
        <strong>Location:</strong><br>${row['location_desc'] || 'N/A'}
      </div>
    `);

    markerClusterGroup.addLayer(marker);
  });

  updateNestCount(data.length);
}

// Update count display
function updateNestCount(count) {
  const countDiv = document.getElementById('nest-count');
  countDiv.textContent = `Total Locations Shown: ${count}`;
}

// Legend with one marker type
const legend = L.control({ position: 'bottomright' });

legend.onAdd = function () {
  const div = L.DomUtil.create('div', 'info legend');
  div.innerHTML = `
    <strong>Locations</strong><br>
    <i style="
      background: teal;
      width: 12px;
      height: 12px;
      display: inline-block;
      margin-right: 6px;
      border: 1px solid #000;
      border-radius: 50%;
    "></i> Parking/Deployment Nests
  `;
  return div;
};

legend.addTo(map);
