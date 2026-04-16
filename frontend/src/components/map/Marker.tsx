import { type FC } from 'react';
import { Marker as LeafletMarker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface MarkerProps {
  position: [number, number];
  title?: string;
  description?: string;
}

// Fix for default marker icon issues in React
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const Marker: FC<MarkerProps> = ({ position, title, description }) => {
  return (
    <LeafletMarker position={position} icon={defaultIcon}>
      {(title || description) && (
        <Popup>
          <div className="p-2">
            {title && <h3 className="font-bold text-gray-900">{title}</h3>}
            {description && <p className="text-sm text-gray-600">{description}</p>}
          </div>
        </Popup>
      )}
    </LeafletMarker>
  );
};

export { Marker };
