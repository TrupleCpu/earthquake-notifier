"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import {
  getMagnitudeColor,
  getMagnitudeRingColor,
} from "./utils/magnitudeStyles";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Blocks } from "react-loader-spinner";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Circle = dynamic(
  () => import("react-leaflet").then((mod) => mod.Circle),
  { ssr: false }
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});
type Earthquake = {
  magnitude: number;
  location: string;
  dateTime: string;
  latitude: number;
  longitude: number;
  url?: string;
};
type EarthquakeResponse = {
  latestEarthquake: Earthquake;
};

export default function Home() {
  usePushNotifications();

  const [data, setData] = useState<Earthquake | null>(null);
  const prevDataRef = useRef<EarthquakeResponse | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/scraper").then((r) => r.json());

        if (prevDataRef.current) {
          const prev = prevDataRef.current.latestEarthquake;
          const curr = res.latestEarthquake;

          if (
            prev.dateTime !== curr.dateTime ||
            prev.latitude !== curr.latitude ||
            prev.longitude !== curr.longitude
          ) {
            await fetch("/api/notify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: "New Earthquake Detected!",
                body: `${curr.location} | Magnitude ${curr.magnitude}`,
              }),
            });

            if (Notification.permission === "granted") {
              new Notification("New Earthquake Detected!", {
                body: `${curr.location} | Magnitude ${curr.magnitude}`,
              });
            }
          }
        }

        prevDataRef.current = res;
        setData(res.latestEarthquake);
      } catch (err) {
        console.error("Error fetching earthquake data:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {data ? (
        <div className="flex flex-col md:flex-row gap-8 w-full">
          {/* Latest Earthquake Card */}
          <div className="quake-item bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 flex flex-col items-center justify-center gap-6  flex-shrink-0 w-full md:w-[320px]">
            <div
              className={`w-28 h-28 md:w-32 md:h-32 flex items-center justify-center rounded-full ${getMagnitudeColor(
                Number(data.magnitude)
              )} ${getMagnitudeRingColor(
                Number(data.magnitude)
              )}  ring-8 animate-pulse`}
            >
              <span className="font-extrabold text-5xl md:text-6xl">
                {data.magnitude}
              </span>
            </div>

            <div className="text-center">
              <h2 className="font-extrabold text-2xl md:text-3xl text-gray-900 dark:text-white mb-2">
                {data.location}
              </h2>
              <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-2">
                <time>{data.dateTime}</time>
              </p>
              {data.url && (
                <a
                  href={data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline text-lg md:text-xl mt-2 inline-block font-semibold"
                >
                  More Details &rarr;
                </a>
              )}
            </div>
          </div>

          {/* Map */}
          <div className=" h-[400px] md:h-[600px] flex-shrink-0 md:flex-grow">
            <MapContainer
              center={[Number(data.latitude), Number(data.longitude)]}
              zoom={8}
              className="h-full rounded-2xl shadow-lg"
              scrollWheelZoom
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              <Circle
                center={[Number(data.latitude), Number(data.longitude)]}
                radius={20000}
                pathOptions={{
                  color: "red",
                  fillColor: "red",
                  fillOpacity: 0.4,
                }}
              >
                <Popup>Earthquake Location</Popup>
              </Circle>
            </MapContainer>
          </div>
        </div>
      ) : (
        <div className="h-screen flex justify-center items-center">
          <Blocks
            height="80"
            width="80"
            color="#4fa94d"
            ariaLabel="blocks-loading"
            wrapperStyle={{}}
            wrapperClass="blocks-wrapper"
            visible={true}
          />
        </div>
      )}
    </>
  );
}
