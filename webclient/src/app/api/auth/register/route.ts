import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://api:3000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Registrierung fehlgeschlagen" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { message: "Verbindung zum Server fehlgeschlagen" },
      { status: 500 }
    );
  }
}
