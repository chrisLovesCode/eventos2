import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://api:3000";
const ACCESS_TOKEN_MAX_AGE = 60 * 15; // 15 minutes
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const accessToken = request.cookies.get("access_token")?.value;
    let refreshToken = request.cookies.get("refresh_token")?.value;
    if (!refreshToken) {
      const cookieHeader = request.headers.get("cookie") || "";
      const match = cookieHeader.match(/(?:^|;\\s*)refresh_token=([^;]+)/);
      refreshToken = match ? match[1] : undefined;
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    } else if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    let response: Response | null = null;

    if (headers["Authorization"]) {
      response = await fetch(`${API_URL}/users/me`, {
        method: "GET",
        headers,
        cache: "no-store",
      });
    }

    if (!response || !response.ok) {
      if (!refreshToken) {
        return NextResponse.json(
          { message: "Nicht authentifiziert" },
          { status: 401 }
        );
      }

      response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refreshToken}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        return NextResponse.json(
          { message: "Nicht authentifiziert" },
          { status: response.status }
        );
      }

      const data = await response.json();
      const responsePayload = NextResponse.json(data.user ?? null);

      if (data?.access_token) {
        responsePayload.cookies.set("access_token", data.access_token, {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          maxAge: ACCESS_TOKEN_MAX_AGE,
          secure: process.env.NODE_ENV === "production",
        });
      }
      if (data?.refresh_token) {
        responsePayload.cookies.set("refresh_token", data.refresh_token, {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          maxAge: REFRESH_TOKEN_MAX_AGE,
          secure: process.env.NODE_ENV === "production",
        });
      }

      return responsePayload;
    }

    const meData = await response.json();
    return NextResponse.json(meData ?? null);
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      { message: "Verbindung zum Server fehlgeschlagen" },
      { status: 500 }
    );
  }
}
