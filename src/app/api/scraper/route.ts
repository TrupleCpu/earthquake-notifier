import { NextResponse } from "next/server";
import redis from "@/lib/redis";
import EarthquakeLog from "@/app/models/EarthquakeLog";
import { connectToDatabase } from "@/lib/mongodb";
import axios from "axios";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const cached: string | null = await redis.get("latestEarthquake");
    if (cached) {
      try {
        return NextResponse.json(JSON.parse(cached));
      } catch {
        console.warn("Invalid cached data, clearing...");
        await redis.del("latestEarthquake");
      }
    }

    const { data } = await axios.get(
      "https://phivolc-scraper.janamaya438.workers.dev/",
      { timeout: 10000 }
    );

    const latestEarthquake = data.latestEarthquake;

    if (!latestEarthquake) {
      throw new Error("Worker did not return latest earthquake");
    }

    await connectToDatabase();
    const exists = await EarthquakeLog.findOne({ dateTime: latestEarthquake.dateTime });
    if (!exists) {
      await EarthquakeLog.create(latestEarthquake);
    }

    await redis.set(
      "latestEarthquake",
      JSON.stringify({ latestEarthquake }),
      { ex: 30 }
    );

    return NextResponse.json({ latestEarthquake });
  } catch (error) {
    console.error("Fetching error:", error);
    return NextResponse.json(
      { error: "Failed to fetch latest earthquake", details: error },
      { status: 500 }
    );
  }
}
