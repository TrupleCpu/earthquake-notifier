import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import axios from "axios";
import https from "https";
import redis from "@/lib/redis";
import EarthquakeLog from "@/app/models/EarthquakeLog";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";
export const revalidate = 0;


export async function GET() {
  try {

   const cached: string | null = await redis.get("latestEarthquake");
      if (cached && typeof cached === "string") {
      try {
        return NextResponse.json(JSON.parse(cached));
      } catch {
        console.warn("Invalid cached data, clearing...");
        await redis.del("latestEarthquake");
      }
    }



    

    const { data: html } = await axios.get("https://earthquake.phivolcs.dost.gov.ph/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(html);

    const firstRow = $("table.MsoNormalTable tr:nth-child(2)");
    const cols = firstRow.find("td");

    if (cols.length < 6) {
      throw new Error("Table structure changed or missing columns");
    }

    const latestEarthquake = {
      dateTime: $(cols[0]).text().trim(),
      latitude: $(cols[1]).text().trim(),
      longitude: $(cols[2]).text().trim(),
      depth: $(cols[3]).text().trim(),
      magnitude: $(cols[4]).text().trim(),
      location: $(cols[5]).text().trim(),
    };

    await connectToDatabase();
    const exists = await EarthquakeLog.findOne({ dateTime: latestEarthquake.dateTime });
    if(!exists){
      await EarthquakeLog.create(latestEarthquake);
    }

  await redis.set("latestEarthquake", JSON.stringify({ latestEarthquake }), {
  ex: 30 
});

    return NextResponse.json({ latestEarthquake });
  } catch (error) {
    console.error("Scraping error:", error);
    return NextResponse.json(
      { error: "Failed to scrape PHIVOLCS", details: error },
      { status: 500 }
    );
  }
}
