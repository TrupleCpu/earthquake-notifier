import EarthquakeLog from "@/app/models/EarthquakeLog";
import { connectToDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await connectToDatabase();

        const allEarthquake = await EarthquakeLog.find()
        .sort({ dateTime: - 1 })
        .lean();

        return NextResponse.json({ earthquakes: allEarthquake });
    } catch(error) {
        return NextResponse.json({ error: error }, { status: 500 })
    }
}