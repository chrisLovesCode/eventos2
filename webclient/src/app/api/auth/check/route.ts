import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://api:3000";

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
        return NextResponse.json({
          authenticated: false,
          hasToken: false,
        });
      }

      const refreshHeaders: HeadersInit = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshToken}`,
      };

      response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: refreshHeaders,
        cache: "no-store",
      });
    }

    if (!response.ok) {
      return NextResponse.json({
        authenticated: false,
        hasToken: false,
      });
    }
    const data = await response.json();

    const responsePayload = NextResponse.json({
      authenticated: true,
      hasToken: true,
    });

    if (data?.access_token) {
      responsePayload.cookies.set("access_token", data.access_token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 15,
        secure: process.env.NODE_ENV === "production",
      });
    }
    if (data?.refresh_token) {
      responsePayload.cookies.set("refresh_token", data.refresh_token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        secure: process.env.NODE_ENV === "production",
      });
    }

    return responsePayload;
  } catch {
    return NextResponse.json({
      authenticated: false,
      hasToken: false,
    });
  }
}
