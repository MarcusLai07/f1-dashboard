import { NextRequest, NextResponse } from "next/server";

const OPENF1_BASE = "https://api.openf1.org/v1";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionKey = searchParams.get("session_key");
  const since = searchParams.get("since"); // ISO timestamp

  if (!sessionKey) {
    return NextResponse.json(
      { error: "session_key is required" },
      { status: 400 }
    );
  }

  try {
    let url = `${OPENF1_BASE}/race_control?session_key=${sessionKey}`;
    if (since) {
      url += `&date>=${since}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`OpenF1 API error: ${response.status}`);
    }

    const messages = await response.json();

    // Transform and categorize messages
    const formattedMessages = messages.map((msg: any) => {
      let category: string = "OTHER";
      let flag: string | undefined;

      // Categorize based on message content and flag
      if (msg.flag) {
        category = "FLAG";
        flag = msg.flag.toUpperCase().replace(" ", "_");
      } else if (
        msg.message?.toLowerCase().includes("safety car") ||
        msg.category === "SafetyCar"
      ) {
        category = "SAFETY_CAR";
      } else if (
        msg.message?.toLowerCase().includes("virtual safety car") ||
        msg.category === "Vsc"
      ) {
        category = "VSC";
      } else if (msg.message?.toLowerCase().includes("drs")) {
        category = "DRS";
      } else if (msg.category === "Flag") {
        category = "FLAG";
      } else if (msg.category === "Incident") {
        category = "INCIDENT";
      }

      return {
        timestamp: msg.date,
        category,
        flag,
        message: msg.message,
        driverNumber: msg.driver_number,
        sector: msg.sector,
        scope: msg.scope,
      };
    });

    // Sort by timestamp descending (newest first)
    formattedMessages.sort(
      (a: any, b: any) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      messages: formattedMessages,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Race control API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch race control messages" },
      { status: 500 }
    );
  }
}
