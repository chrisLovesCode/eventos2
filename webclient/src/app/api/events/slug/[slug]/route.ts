import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://api:3000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const authHeader = request.headers.get("authorization");
    const cookieToken = request.cookies.get("access_token")?.value;
    
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    
    // Forward authorization header if present
    if (authHeader) {
      headers["Authorization"] = authHeader;
    } else if (cookieToken) {
      headers["Authorization"] = `Bearer ${cookieToken}`;
    }
    
    const response = await fetch(`${API_URL}/events/slug/${slug}`, {
      method: "GET",
      headers,
      cache: "no-store", // No cache for freshly created events
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: "Event nicht gefunden" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Event fetch by slug error:", error);
    return NextResponse.json(
      { message: "Verbindung zum Server fehlgeschlagen" },
      { status: 500 }
    );
  }
}
