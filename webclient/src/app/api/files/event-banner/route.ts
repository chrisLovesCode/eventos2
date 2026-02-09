import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Try to get token from Authorization header (sent by client)
    const authHeader = request.headers.get('authorization');
    let accessToken = authHeader?.replace('Bearer ', '');

    // Fallback: Try cookie
    if (!accessToken) {
      const cookieStore = await cookies();
      accessToken = cookieStore.get('access_token')?.value;
    }

    if (!accessToken) {
      console.error('No access token found');
      return NextResponse.json(
        { message: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    // Get the file from the request
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      console.error('No file in formData');
      return NextResponse.json(
        { message: 'Keine Datei gefunden' },
        { status: 400 }
      );
    }

    console.log('File received:', file instanceof File ? file.name : 'Not a file');

    const apiUrl =
      process.env.API_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      'http://localhost:3000';

    console.log('Uploading to:', `${apiUrl}/files/event-banner`);

    const response = await fetch(`${apiUrl}/files/event-banner`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    console.log('Backend response status:', response.status);

    const data = await response.json();

    if (!response.ok) {
      console.error('Backend error:', data);
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Banner upload error:', error);
    return NextResponse.json(
      { message: 'Error uploading banner', error: String(error) },
      { status: 500 }
    );
  }
}
