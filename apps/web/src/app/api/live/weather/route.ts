import { NextRequest, NextResponse } from "next/server";

const OPENF1_BASE = "https://api.openf1.org/v1";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionKey = searchParams.get("session_key");

  if (!sessionKey) {
    return NextResponse.json(
      { error: "session_key is required" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `${OPENF1_BASE}/weather?session_key=${sessionKey}`
    );

    if (!response.ok) {
      throw new Error(`OpenF1 API error: ${response.status}`);
    }

    const weatherData = await response.json();

    if (weatherData.length === 0) {
      return NextResponse.json({
        weather: null,
        timestamp: new Date().toISOString(),
      });
    }

    // Get the latest weather reading
    const latest = weatherData[weatherData.length - 1];

    return NextResponse.json({
      weather: {
        airTemp: latest.air_temperature,
        trackTemp: latest.track_temperature,
        humidity: latest.humidity,
        pressure: latest.pressure,
        windSpeed: latest.wind_speed,
        windDirection: latest.wind_direction,
        rainfall: latest.rainfall > 0,
        timestamp: latest.date,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Weather API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch weather" },
      { status: 500 }
    );
  }
}
