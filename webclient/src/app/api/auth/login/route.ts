import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://api:3000";
const ACCESS_TOKEN_MAX_AGE = 60 * 15; // 15 minutes
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Login fehlgeschlagen" },
        { status: response.status }
      );
    }

    const responsePayload = NextResponse.json(data);
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
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Verbindung zum Server fehlgeschlagen" },
      { status: 500 }
    );
  }
}
