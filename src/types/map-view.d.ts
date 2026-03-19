declare module "@/map/view/map.js" {
  export function initializeMapView(): Promise<() => void>;
}
