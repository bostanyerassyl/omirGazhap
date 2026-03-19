const buildings = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "Library",
        "description": "Main campus library"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [43.674008, 77.107961],
          [43.67239237763593, 77.11450266344117],
          [43.67541788819099, 77.11543572072134]
        ]]
      }
    }
  ]
};

var map = L.map('map').setView([
    43.674008, 77.107961
], 15);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 20,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

L.geoJSON(buildings, {
  onEachFeature: function (feature, layer) {
    layer.on('click', function () {
      layer.bindPopup(`
        <b>${feature.properties.name}</b><br>
        ${feature.properties.description}<br>
        <button onclick="alert('More info')">More</button>
      `).openPopup();
    });
  }
}).addTo(map);

L.geoJSON(buildings, {
  style: {
    color: "#3388ff",
    weight: 2,
    fillOpacity: 0.5
  }
}).addTo(map);

L.marker([43.674008, 77.107961]).addTo(map)
L.popup()
    .setLatLng([43.674008, 77.107961])
    .setContent("Omir Gazhap")
    .openOn(map);
var latlngs = [
    [43.674008, 77.107961],
    [43.67239237763593, 77.11450266344117],
    [43.67541788819099, 77.11543572072134]
];

var polyline = L.polyline(latlngs, {color: 'red'}).addTo(map);

// zoom the map to the polyline
//map.fitBounds(polyline.getBounds());