
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

function CourtMap({
  latitude = 10.3157,
  longitude = 123.8854,
  courtName = "Pickleball Court",
}) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={16}
      scrollWheelZoom={true}
      style={{
        height: "250px",
        width: "100%",
        borderRadius: "10px",
      }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={[latitude, longitude]}>
        <Popup>{courtName}</Popup>
      </Marker>
    </MapContainer>
  );
}

export default CourtMap;