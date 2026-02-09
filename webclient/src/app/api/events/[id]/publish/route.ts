import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://api:3000";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const authHeader = request.headers.get("authorization");
    const cookieToken = request.cookies.get("access_token")?.value;

    if (!authHeader && !cookieToken) {
      return NextResponse.json(
        { message: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_URL}/events/${id}/publish`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader ?? `Bearer ${cookieToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        data ?? { message: "Fehler beim Aktualisieren des Veröffentlichungsstatus" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Event publish update error:", error);
    return NextResponse.json(
      { message: "Verbindung zum Server fehlgeschlagen" },
      { status: 500 }
    );
  }
}
