// GET /api/f1/circuits - List all circuits
import { NextResponse } from "next/server";
import { getAllCircuits, getAllCircuitIds } from "@/data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idsOnly = searchParams.get("ids") === "true";

  try {
    if (idsOnly) {
      const ids = await getAllCircuitIds();
      return NextResponse.json({ ids });
    }

    const circuits = await getAllCircuits();
    return NextResponse.json({ circuits });
  } catch (error) {
    console.error("Circuits API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch circuits" },
      { status: 500 }
    );
  }
}
