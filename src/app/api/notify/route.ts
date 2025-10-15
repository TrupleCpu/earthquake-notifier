    import { NextResponse, NextRequest } from "next/server";
    import webPush from 'web-push';
    import { connectToDatabase } from "@/lib/mongodb";
    import Subscription from "@/app/models/Subscription";

    webPush.setVapidDetails(
        "mailto:you@example.com",
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        process.env.VAPID_PRIVATE_KEY!
    )

     interface SubscriptionPayload {
            endpoint: string;
            keys: {
                p256dh: string;
                auth: string;
            };
            }


    export async function POST(req: NextRequest){
        try {
            await connectToDatabase();
            const { title, body } = await req.json();
            
            const rawSubs = await Subscription.find().lean();

            const subscriptions: SubscriptionPayload[] = rawSubs.map((sub: any) => ({
            endpoint: sub.endpoint,
            keys: {
                p256dh: sub.keys?.p256dh,
                auth: sub.keys?.auth,
            },
            }));
            await Promise.all(
            subscriptions.map((sub) =>
                webPush.sendNotification(sub, JSON.stringify({ title, body }))
            )
            );


            return NextResponse.json({ sucess: true });
        } catch (err) {
        console.error("Notify error:", err);
        return NextResponse.json({ error: "Failed to send notifications" }, { status: 500 });
    }
    }