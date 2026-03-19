const buildingDescriptions = new Map(); // replace with DB calls later

document.addEventListener("DOMContentLoaded", async () => {
  const styleRes = await fetch('https://tiles.stadiamaps.com/styles/osm_bright.json');
  const style = await styleRes.json();

  const map = new maplibregl.Map({
    container: 'map',
    style: style,
    center: [77.107961, 43.674008],
    zoom: 15
  });

  map.addControl(new maplibregl.NavigationControl());

  map.on('load', () => {

    // GeoJSON sources that hold the highlighted geometry
    map.addSource('building-hover', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });
    map.addSource('building-selected', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    // Insert highlight layers below map labels
    let firstSymbolId;
    for (const layer of map.getStyle().layers) {
      if (layer.type === 'symbol') { firstSymbolId = layer.id; break; }
    }

    map.addLayer({
      id: 'building-hover-fill',
      type: 'fill',
      source: 'building-hover',
      paint: { 'fill-color': '#00aaff', 'fill-opacity': 0.5 }
    }, firstSymbolId);

    map.addLayer({
      id: 'building-selected-fill',
      type: 'fill',
      source: 'building-selected',
      paint: { 'fill-color': '#ff4444', 'fill-opacity': 0.65 }
    }, firstSymbolId);

    // Transparent layer to catch mouse events on buildings
    map.addLayer({
      id: 'building-interact',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'building',
      paint: { 'fill-opacity': 0 }
    });

    // ------------------
    // HOVER
    // ------------------
    map.on('mousemove', 'building-interact', (e) => {
      if (e.features.length > 0) {
        map.getSource('building-hover').setData({
          type: 'FeatureCollection',
          features: [e.features[0]]
        });
      }
    });

    map.on('mouseleave', 'building-interact', () => {
      map.getSource('building-hover').setData({ type: 'FeatureCollection', features: [] });
      map.getCanvas().style.cursor = '';
    });

    // ------------------
    // CLICK + POPUP
    // ------------------
    map.on('click', 'building-interact', (e) => {
      const feature = e.features[0];

      // Build a stable ID: prefer osm_id property, fall back to tile feature id
      const buildingId = String(
        feature.properties?.osm_id ?? feature.id ?? `${e.lngLat.lng.toFixed(5)},${e.lngLat.lat.toFixed(5)}`
      );

      map.getSource('building-selected').setData({
        type: 'FeatureCollection',
        features: [feature]
      });

      const savedDesc = buildingDescriptions.get(buildingId) ?? '';
      const buildingName = feature.properties?.name || null;

      const popup = new maplibregl.Popup({ maxWidth: '280px' })
        .setLngLat(e.lngLat)
        .setHTML(`
          <div style="font-family: sans-serif; padding: 4px 2px">
            <h3 style="margin: 0 0 4px">${buildingName ?? 'Building'}</h3>
            <p style="margin: 0 0 10px; font-size: 11px; color: #999">ID: ${buildingId}</p>
            <label style="font-size: 12px; font-weight: 600">Description</label>
            <textarea
              id="desc-input"
              rows="3"
              placeholder="Add a custom description..."
              style="display:block; width:100%; margin-top:4px; padding:5px; box-sizing:border-box; font-size:12px; border:1px solid #ccc; border-radius:4px; resize:vertical"
            >${savedDesc}</textarea>
            <button
              id="desc-save-btn"
              style="margin-top:8px; width:100%; padding:7px 0; background:#0078d4; color:#fff; border:none; border-radius:4px; cursor:pointer; font-size:13px"
            >Save</button>
            <p id="desc-saved-msg" style="display:none; margin:6px 0 0; color:green; font-size:12px; text-align:center">✓ Description saved</p>
          </div>
        `)
        .addTo(map);

      // Wire up save button after popup is in the DOM
      popup.getElement().querySelector('#desc-save-btn').addEventListener('click', () => {
        const val = popup.getElement().querySelector('#desc-input').value ?? '';
        buildingDescriptions.set(buildingId, val);
        // TODO: replace with DB write, e.g. fetch('/api/buildings', { method:'POST', body: JSON.stringify({id: buildingId, description: val}) })

        const msg = popup.getElement().querySelector('#desc-saved-msg');
        msg.style.display = 'block';
        setTimeout(() => { msg.style.display = 'none'; }, 2000);
      });
    });

    // ------------------
    // CURSOR
    // ------------------
    map.on('mouseenter', 'building-interact', () => {
      map.getCanvas().style.cursor = 'pointer';
    });

  });
});