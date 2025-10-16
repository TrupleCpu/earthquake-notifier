import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import axios from "axios";
import redis from "@/lib/redis";
import EarthquakeLog from "@/app/models/EarthquakeLog";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    const { data: html } = await axios.get("https://earthquake.phivolcs.dost.gov.ph/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
      },
      timeout: 5000,
    });

    const $ = cheerio.load(html);
    const rows = $("table.MsoNormalTable tr").toArray();
    const validRow = rows.find(row => $(row).find("td").length >= 6);

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

    await redis.set("latestEarthquake", JSON.stringify({ latestEarthquake }), {
      ex: 30,
    });

    return NextResponse.json({ latestEarthquake });
  } catch (error) {
    console.error("Scraping error:", error);

    const fallback = await redis.get("latestEarthquake");

if (typeof fallback === "string" && fallback.length > 0) {
  try {
    return NextResponse.json(JSON.parse(fallback));
  } catch {
    console.warn("Fallback cache also invalid");
  }
}


    return NextResponse.json(
      { error: "Failed to scrape PHIVOLCS", details: error },
      { status: 500 }
    );
  }
}
