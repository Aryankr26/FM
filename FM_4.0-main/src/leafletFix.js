import L from 'leaflet';

// Import local marker assets
import markerIcon from './assets/leaflet/marker-icon.png';
import markerIcon2x from './assets/leaflet/marker-icon-2x.png';
import markerShadow from './assets/leaflet/marker-shadow.png';

// Fix default icon paths (Vite + Leaflet issue)
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});
