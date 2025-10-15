"use client";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Circle = dynamic(() => import("react-leaflet").then(mod => mod.Circle), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });

export default function MapContent() {
  const searchParams = useSearchParams();
  const lat = parseFloat(searchParams.get("lat") ?? "14.5995");
  const lng = parseFloat(searchParams.get("lng") ?? "120.9842");

  return (
    <div className="w-full h-screen">
      <MapContainer
        center={[lat, lng]}
        zoom={8}
        className="w-full h-full z-0"
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <Circle
          center={[lat, lng]}
          radius={20000}
          pathOptions={{ color: "red", fillColor: "red", fillOpacity: 0.4 }}
        >
          <Popup>Earthquake Location</Popup>
        </Circle>
      </MapContainer>
    </div>
  );
}
