import { NextResponse } from "next/server";
import redis from "@/lib/redis";
import EarthquakeLog from "@/app/models/EarthquakeLog";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const cached = await redis.get("latestEarthquake");

    if (cached && typeof cached === "string") {
      try {
        const parsed = JSON.parse(cached);
        if (parsed?.latestEarthquake) {
          console.log("✅ Cache hit");
          return NextResponse.json(parsed);
        }
      } catch (err) {
        console.warn("⚠️ Corrupted cache detected. Deleting key...", err);
        await redis.del("latestEarthquake");
      }
    }

    const res = await fetch("https://phivolc-scraper.janamaya438.workers.dev/", {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`Worker returned ${res.status}`);
    const data = await res.json();

    const latestEarthquake = data.latestEarthquake;
    if (!latestEarthquake) throw new Error("Missing latestEarthquake in worker response");

    await connectToDatabase();
    const exists = await EarthquakeLog.findOne({ dateTime: latestEarthquake.dateTime });
    if (!exists) await EarthquakeLog.create(latestEarthquake);

    const safeJSON = JSON.stringify({ latestEarthquake });
    await redis.set("latestEarthquake", safeJSON, { ex: 30 });

    return NextResponse.json({ latestEarthquake });

  } catch (error: any) {
    console.error("❌ Error fetching earthquake data:", error);
    return NextResponse.json(
      { error: "Failed to fetch latest earthquake", details: error.message },
      { status: 500 }
    );
  }
}
