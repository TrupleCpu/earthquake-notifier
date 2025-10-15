"use client";

import { MapContainer, TileLayer } from "react-leaflet";


export default function LeafletMap() {
  return (
    <MapContainer
      center={[14.5995, 120.9842]}
      zoom={12}
      scrollWheelZoom={true}
      className="h-[500px] w-full rounded-xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    
    </MapContainer>
  );
}
