import { NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://api:3000";

export async function GET() {
  try {
    const response = await fetch(`${API_URL}/categories`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: "Fehler beim Laden der Kategorien" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Categories fetch error:", error);
    return NextResponse.json(
      { message: "Verbindung zum Server fehlgeschlagen" },
      { status: 500 }
    );
  }
}
