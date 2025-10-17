import { NextResponse } from "next/server";
import EarthquakeLog from "@/app/models/EarthquakeLog";
import { connectToDatabase } from "@/lib/mongodb";
import axios from "axios";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const { data } = await axios.get(
      "https://phivolc-scraper.janamaya438.workers.dev/",
      { timeout: 10000 }
    );

    const latestEarthquake = data.latestEarthquake;

    if (!latestEarthquake) {
      throw new Error("Worker did not return latest earthquake");
    }

    await connectToDatabase();
    const exists = await EarthquakeLog.findOne({
      dateTime: latestEarthquake.dateTime,
    });
    if (!exists) {
      await EarthquakeLog.create(latestEarthquake);
    }

    return NextResponse.json({ latestEarthquake });
  } catch (error) {
    console.error("Fetching error:", error);
    return NextResponse.json(
      { error: "Failed to fetch latest earthquake", details: error.message },
      { status: 500 }
    );
  }
}
