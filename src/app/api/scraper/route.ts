import { NextResponse } from "next/server";
import redis from "@/lib/redis";
import EarthquakeLog from "@/app/models/EarthquakeLog";
import { connectToDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const cached = await redis.get("latestEarthquake");
    if (cached && typeof cached === "string") {
      const parsed = JSON.parse(cached);
      if (parsed?.latestEarthquake) {
        console.log("✅ Redis cache hit");
        return NextResponse.json(parsed);
      }
    }

    console.log("🌎 Fetching latest earthquake from remote scraper…");
    const res = await fetch("https://scrape-test-alpha.vercel.app/api/scrape", {
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`Failed to fetch scraper data: ${res.status}`);
    const data = await res.json();

    if (!data?.latestEarthquake)
      throw new Error("Invalid response structure from scraper");

    const { latestEarthquake } = data;

    await redis.set("latestEarthquake", JSON.stringify(data), { ex: 10 });

    await connectToDatabase();
    const exists = await EarthquakeLog.exists({ dateTime: latestEarthquake.dateTime });

    if (!exists) {
      await EarthquakeLog.create(latestEarthquake);
      console.log("🪶 New earthquake logged:", latestEarthquake.dateTime);
    } else {
      console.log("ℹ️ Already logged:", latestEarthquake.dateTime);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Failed to fetch from scraper:", error);
    return NextResponse.json(
      { error: "Fetch failed", details: error },
      { status: 500 }
    );
  }
}
