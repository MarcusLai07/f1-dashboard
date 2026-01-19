// GET /api/f1/circuits/[id] - Get single circuit by ID
import { NextResponse } from "next/server";
import { getCircuit } from "@/data";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const circuit = await getCircuit(id);

    if (!circuit) {
      return NextResponse.json(
        { error: `Circuit not found: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json(circuit);
  } catch (error) {
    console.error(`Circuit API error for ${id}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch circuit" },
      { status: 500 }
    );
  }
}
