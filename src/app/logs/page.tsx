"use client";
import React, { useEffect, useState } from "react";
import {
  getMagnitudeColor,
  getMagnitudeRingColor,
} from "../utils/magnitudeStyles";
import { useRouter } from "next/navigation";

type EarthquakeLog = {
  _id: string;
  magnitude: number;
  location: string;
  dateTime: string;
  latitude: number;
  longitude: number;
};


const Page = () => {
  const [data, setData] = useState<EarthquakeLog[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetch("/api/logs");
      const res: { earthquakes: EarthquakeLog[] } = await data.json();

      console.log(res);
      setData(res.earthquakes);
    };

    fetchData();
  }, []);

  const handleClick = (lat: number, lng: number) => {
    if (!data) return;
    router.push(`/map?lat=${lat}&lng=${lng}`);
  };
  return (
    <div className="space-y-4">
      {data.map((data) => (
        <div
          onClick={() =>
            handleClick(Number(data.latitude), Number(data.longitude))
          }
          className="quake-item bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 flex items-start space-x-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
          key={data._id}
        >
          <div
            className={`flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-full ${getMagnitudeColor(Number(data.magnitude))} ${getMagnitudeRingColor(Number(data.magnitude))} ring-4`}
          >
            <span className="font-bold text-2xl magnitude">
              {data.magnitude}
            </span>
          </div>
          <div className="flex-grow">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">
              {data.location}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <time>{data.dateTime}</time>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Page;
