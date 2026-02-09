import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

const API_URL = process.env.API_URL || "http://api:3000";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get("authorization");
    const cookieToken = request.cookies.get("access_token")?.value;
    
    // Forward all query parameters
    const queryString = searchParams.toString();
    const url = `${API_URL}/events${queryString ? `?${queryString}` : ""}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Forward authorization header or cookie token if present
    if (authHeader) {
      headers["Authorization"] = authHeader;
    } else if (cookieToken) {
      headers["Authorization"] = `Bearer ${cookieToken}`;
    }

    const isAuthenticatedRequest = Boolean(authHeader || cookieToken);
    const response = await fetch(url, {
      method: "GET",
      headers,
      ...(isAuthenticatedRequest
        ? { cache: "no-store" as const }
        : { next: { revalidate: 60 } }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: "Fehler beim Laden der Events" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Events fetch error:", error);
    return NextResponse.json(
      { message: "Verbindung zum Server fehlgeschlagen" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get("authorization");
    const cookieToken = request.cookies.get("access_token")?.value;

    if (!authHeader && !cookieToken) {
      return NextResponse.json(
        { message: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_URL}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader ?? `Bearer ${cookieToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    
    // Revalidate events list and new event page to clear cache
    revalidatePath('/');
    revalidatePath('/events');
    revalidatePath(`/events/${data.slug}`);
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Event create error:", error);
    return NextResponse.json(
      { message: "Fehler beim Erstellen des Events" },
      { status: 500 }
    );
  }
}
