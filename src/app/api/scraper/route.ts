import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import axios from "axios";
import redis from "@/lib/redis";
import EarthquakeLog from "@/app/models/EarthquakeLog";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type EarthquakeData = {
  dateTime: string;
  latitude: string;
  longitude: string;
  depth: string;
  magnitude: string;
  location: string;
};

export async function GET() {
  const cached = await redis.get("latestEarthquake");
  if (typeof cached === "string" && cached.length > 0) {
    try {
      return NextResponse.json(JSON.parse(cached));
    } catch {
      console.warn("Invalid cached data, clearing...");
      await redis.del("latestEarthquake");
    }
  }

  try {
    let html: string | null = null;

    try {
      const { data } = await axios.get("https://earthquake.phivolcs.dost.gov.ph/", {
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 4000,
      });
      html = data;
    } catch (err) {
      console.warn("Direct fetch failed, retrying via proxy...");
      // Fallback proxy if PHIVOLCS blocks Vercel
      const { data } = await axios.get(
        `https://api.codetabs.com/v1/proxy?quest=https://earthquake.phivolcs.dost.gov.ph/`,
        { timeout: 4000 }
      );
      html = typeof data === "string" ? data : data.contents;
    }

    const $ = cheerio.load(html!);
    const rows = $("table.MsoNormalTable tr").toArray();
    const validRow = rows.find((row) => $(row).find("td").length >= 6);
    if (!validRow) throw new Error("No valid earthquake row found");

    const cols = $(validRow).find("td");
    const latestEarthquake: EarthquakeData = {
      dateTime: $(cols[0]).text().trim(),
      latitude: $(cols[1]).text().trim(),
      longitude: $(cols[2]).text().trim(),
      depth: $(cols[3]).text().trim(),
      magnitude: $(cols[4]).text().trim(),
      location: $(cols[5]).text().trim(),
    };

    await connectToDatabase();
    await EarthquakeLog.updateOne(
      { dateTime: latestEarthquake.dateTime },
      { $setOnInsert: latestEarthquake },
      { upsert: true }
    );

    await redis.set("latestEarthquake", JSON.stringify({ latestEarthquake }), { ex: 30 });

    return NextResponse.json({ latestEarthquake });
  } catch (error: any) {
    console.error("Scraping error:", error.message);

    const fallback = await redis.get("latestEarthquake");
    if (typeof fallback === "string" && fallback.length > 0) {
      try {
        return NextResponse.json(JSON.parse(fallback));
      } catch {
        console.warn("Fallback cache invalid");
      }
    }

    return NextResponse.json(
      { error: "Failed to scrape PHIVOLCS", details: error.message },
      { status: 500 }
    );
  }
}
