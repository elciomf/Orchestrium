import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const response = await fetch(
      `http://localhost:8080/workflows/${id}/resume`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error(
      `Erro no proxy PATCH /workflows/resume:`,
      error,
    );
    return NextResponse.json(
      { error: "Erro ao retomar workflow" },
      { status: 500 },
    );
  }
}
