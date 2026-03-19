import { useEffect } from "react"
import "maplibre-gl/dist/maplibre-gl.css"
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css"
import "@/map/view/map.css"
import { useAuth } from "@/features/auth/model/AuthProvider"

interface InteractiveMapViewProps {
  toolbarTop?: number
}

export function InteractiveMapView({ toolbarTop = 84 }: InteractiveMapViewProps) {
  const { role } = useAuth()

  useEffect(() => {
    let teardown: null | (() => void) = null

    const boot = async () => {
      const { initializeMapView } = await import("@/map/view/map.js")
      teardown = await initializeMapView()
    }

    void boot()

    return () => {
      teardown?.()
      document.body.classList.remove("sidebar-open")
    }
  }, [])

  return (
    <div className="city-map-root">
      <div id="map" data-role={role ?? ""} />

      <div id="draw-toolbar" style={{ top: `${toolbarTop}px` }}>
        <button className="draw-btn" data-mode="simple_select">Select</button>
        <button className="draw-btn" data-mode="draw_point">Point</button>
        <button className="draw-btn" data-mode="draw_line_string">Line</button>
        <button className="draw-btn" data-mode="draw_polygon">Polygon</button>
        <button id="draw-delete">Delete</button>
      </div>

      <aside id="sidebar">
        <div id="sidebar-banner">
          <img id="banner-img" alt="Building banner" />
          <div id="banner-placeholder">Click to add banner image</div>
          <button id="banner-remove">Remove</button>
          <input type="file" id="banner-upload" accept="image/*" />
        </div>

        <div id="sidebar-header">
          <div id="sidebar-header-text">
            <div id="building-name" title="Click to edit">Building</div>
            <input id="building-title-input" placeholder="Enter title..." />
            <div id="building-meta">-</div>
          </div>
          <button id="sidebar-close">Close</button>
        </div>

        <div id="sidebar-body">
          <div className="section" id="feature-section" style={{ display: "none" }}>
            <div className="section-label">Feature</div>
            <div className="prop-grid">
              <div className="prop-item" style={{ gridColumn: "span 2" }}>
                <div className="prop-key">Title</div>
                <input className="prop-val" id="feature-title" placeholder="Name this feature..." />
              </div>
              <div className="prop-item" style={{ gridColumn: "span 2" }}>
                <div className="prop-key">Color</div>
                <input type="color" id="feature-color" defaultValue="#e74c3c" />
              </div>
              <div className="prop-item" style={{ gridColumn: "span 2" }}>
                <div className="prop-key">Icon</div>
                <div id="icon-options" style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  <button className="icon-btn" data-icon="none">None</button>
                  <button className="icon-btn" data-icon="📍">📍</button>
                  <button className="icon-btn" data-icon="⭐">⭐</button>
                  <button className="icon-btn" data-icon="🏠">🏠</button>
                  <button className="icon-btn" data-icon="🏢">🏢</button>
                  <button className="icon-btn" data-icon="⚠️">⚠️</button>
                  <button className="icon-btn" data-icon="🔴">🔴</button>
                  <button className="icon-btn" data-icon="🟢">🟢</button>
                  <button className="icon-btn" data-icon="custom">Custom</button>
                </div>
                <input type="file" id="icon-upload" accept="image/*,.svg" style={{ display: "none" }} />
              </div>
            </div>
            <textarea id="feature-desc" placeholder="Description..." />
            <div id="observations-section" className="section" style={{ display: "none" }}>
              <div className="section-label">Observations</div>
              <div id="observations-role-hint" className="obs-hint" />
              <div id="observations-list" className="obs-list" />
              <div id="observations-form">
                <div className="obs-row">
                  <label htmlFor="observation-asset-id">Asset ID</label>
                  <input id="observation-asset-id" className="prop-val" placeholder="UUID of asset" />
                  <div id="observation-asset-hint" className="obs-hint">
                    Optional. UUID format example: 123e4567-e89b-12d3-a456-426614174000
                  </div>
                </div>
                <div id="observation-fields" className="obs-fields" />
                <div className="obs-actions">
                  <button id="observation-refresh" type="button">Load observations</button>
                  <button id="observation-save" type="button">Add observation</button>
                </div>
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-label">Description</div>
            <textarea id="desc-textarea" placeholder="Add a description..." />
          </div>

          <div className="section">
            <div className="section-label">Tags</div>
            <div id="tags-container" />
            <input id="tag-input" type="text" placeholder="Type a tag and press Enter..." />
          </div>

          <div className="section">
            <div className="section-label">Properties</div>
            <div className="prop-grid">
              <div className="prop-item">
                <div className="prop-key">Levels</div>
                <input className="prop-val" id="prop-levels" placeholder="-" />
              </div>
              <div className="prop-item">
                <div className="prop-key">Type</div>
                <input className="prop-val" id="prop-type" placeholder="-" />
              </div>
              <div className="prop-item">
                <div className="prop-key">Roof</div>
                <input className="prop-val" id="prop-roof" placeholder="-" />
              </div>
              <div className="prop-item">
                <div className="prop-key">Min Height</div>
                <input className="prop-val" id="prop-minheight" placeholder="-" />
              </div>
            </div>
          </div>
        </div>

        <div id="sidebar-footer">
          <button id="btn-save">Save changes</button>
        </div>
      </aside>
    </div>
  )
}
