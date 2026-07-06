import { NextResponse } from "next/server";
import { getTokenWithExpiry, isOpenF1AuthEnabled } from "@/lib/openf1";

export async function GET() {
  if (!isOpenF1AuthEnabled()) {
    return NextResponse.json(
      { error: "OpenF1 authentication not configured" },
      { status: 503 }
    );
  }

  try {
    const tokenData = await getTokenWithExpiry();

    if (!tokenData) {
      return NextResponse.json(
        { error: "Failed to acquire token" },
        { status: 503 }
      );
    }

    return NextResponse.json({
      accessToken: tokenData.accessToken,
      expiresAt: tokenData.expiresAt,
    });
  } catch (error) {
    console.error("[Stream Token] Error:", error);
    return NextResponse.json(
      { error: "Token fetch failed" },
      { status: 500 }
    );
  }
}
