import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Subscription from "@/app/models/Subscription";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const subscriptionData = await req.json();

    await Subscription.updateOne(
      { endpoint: subscriptionData.endpoint },
      subscriptionData,
      { upsert: true }
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json(
      { error: "Failed to save subscription" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectToDatabase();

    const subscriptions = await Subscription.find().lean();
    return NextResponse.json({ subscriptions }, { status: 200 });
  } catch (err) {
    console.error("Fetch subscriptions error:", err);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}
