import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

const API_URL = process.env.API_URL || "http://api:3000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get("authorization");
    const cookieToken = request.cookies.get("access_token")?.value;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (authHeader) {
      headers["Authorization"] = authHeader;
    } else if (cookieToken) {
      headers["Authorization"] = `Bearer ${cookieToken}`;
    }
    const response = await fetch(`${API_URL}/events/${id}`, {
      method: "GET",
      headers,
      next: { revalidate: 60 },
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
    console.error("Event fetch error:", error);
    return NextResponse.json(
      { message: "Verbindung zum Server fehlgeschlagen" },
      { status: 500 }
    );
  }
}

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

    const response = await fetch(`${API_URL}/events/${id}`, {
      method: "PATCH",
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
    
    // Revalidate the event detail page and events list to clear cache
    if (data?.slug) {
      revalidatePath(`/events/${data.slug}`);
    }
    revalidatePath('/events');
    revalidatePath('/');
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Event update error:", error);
    return NextResponse.json(
      { message: "Error updating event" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get("authorization");
    const cookieToken = request.cookies.get("access_token")?.value;

    if (!authHeader && !cookieToken) {
      return NextResponse.json(
        { message: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_URL}/events/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader ?? `Bearer ${cookieToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    // Revalidate lists and detail page
    revalidatePath('/');
    revalidatePath('/events');
    revalidatePath(`/events/${id}`);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Event delete error:", error);
    return NextResponse.json(
      { message: "Error deleting event" },
      { status: 500 }
    );
  }
}
