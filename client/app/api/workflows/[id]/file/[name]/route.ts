import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string; name: string }>;
  },
) {
  try {
    const { id, name } = await params;

    if (!name) {
      return NextResponse.json(
        { error: "Nome do arquivo é obrigatório" },
        { status: 400 },
      );
    }

    const response = await fetch(
      `http://localhost:8080/workflows/${id}/file/${name}`,
      {
        method: "GET",
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
      `Erro no proxy GET /workflows/:id/file/:name`,
      error,
    );
    return NextResponse.json(
      { error: "Erro ao buscar arquivo do workflow" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string; name: string }>;
  },
) {
  try {
    const { id, name } = await params;

    if (!name) {
      return NextResponse.json(
        { error: "Nome do arquivo é obrigatório" },
        { status: 400 },
      );
    }

    const body = await request.json();

    if (!body.content || typeof body.content !== "string") {
      return NextResponse.json(
        {
          error:
            "Campo 'content' é obrigatório e deve ser string",
        },
        { status: 400 },
      );
    }

    const response = await fetch(
      `http://localhost:8080/workflows/${id}/file/${name}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: body.content,
        }),
      },
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error(
      `Erro no proxy PATCH /workflows/:id/file/:name`,
      error,
    );
    return NextResponse.json(
      { error: "Erro ao atualizar arquivo do workflow" },
      { status: 500 },
    );
  }
}
