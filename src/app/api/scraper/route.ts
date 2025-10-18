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
          console.log("✅ Redis cache hit");
          return NextResponse.json(parsed);
        }
      } catch (err) {
        console.warn("⚠️ Corrupted Redis data, deleting...");
        await redis.del("latestEarthquake");
      }
    }

    const res = await fetch("https://phivolc-scraper.janamaya438.workers.dev/", {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`Worker returned status ${res.status}`);
    const data = await res.json();
    const latestEarthquake = data.latestEarthquake;

    if (!latestEarthquake) throw new Error("Missing latestEarthquake in worker response");

    const safeJSON = JSON.stringify({ latestEarthquake });
    await redis.set("latestEarthquake", safeJSON, { ex: 10 });

    await connectToDatabase();
    const exists = await EarthquakeLog.exists({ dateTime: latestEarthquake.dateTime });
    if (!exists) {
      await EarthquakeLog.create(latestEarthquake);
      console.log("🪶 New earthquake logged:", latestEarthquake.dateTime);
    }

    return NextResponse.json({ latestEarthquake });

  } catch (error) {
    console.error("❌ Failed to fetch earthquake data:", error);
    return NextResponse.json(
      { error: "Failed to fetch latest earthquake", details: error },
      { status: 500 }
    );
  }
}
