import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
export default function FarmMap({ lat, lng, name = 'Farm region' }) {
  const ref = useRef();
  useEffect(() => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const map = L.map(ref.current, { scrollWheelZoom: false }).setView([lat, lng], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    L.circle([lat, lng], { radius: 2500, color: '#2f6b3b', fillOpacity: 0.15 })
      .addTo(map)
      .bindTooltip(name);
    if (!Number.isFinite(lat) || !Number.isFinite(lng))
      return <p className="notice">No public map location has been shared.</p>;
    return () => map.remove();
  }, [lat, lng, name]);
  return (
    <div>
      <div className="farm-map" ref={ref} role="img" aria-label={'Approximate region of ' + name} />
      <small className="muted">
        Approximate farm region only. Exact pickup details are shared with confirmed orders.
      </small>
    </div>
  );
}
