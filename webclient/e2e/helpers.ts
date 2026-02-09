/**
 * Helper functions for E2E tests
 */

const API_URL = process.env.E2E_API_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.dev';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeMe';

interface ApiResponse {
  ok: boolean;
  status: number;
  data?: any;
}

/**
 * Verify user email via direct API call (bypasses email verification)
 */
async function getAdminToken(): Promise<string | null> {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });

    if (!response.ok) {
      console.error('Admin login failed:', response.status);
      return null;
    }

    const data = await response.json();
    return data?.access_token ?? null;
  } catch (error) {
    console.error('Admin login error:', error);
    return null;
  }
}

export async function verifyUserEmail(email: string): Promise<ApiResponse> {
  try {
    const adminToken = await getAdminToken();
    if (!adminToken) {
      return { ok: false, status: 401 };
    }

    const response = await fetch(`${API_URL}/admin/test/verify-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    
    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    console.error('Failed to verify user:', error);
    return {
      ok: false,
      status: 500,
    };
  }
}

/**
 * Generate random test user email
 */
export function generateTestEmail(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `chrisvaupel+e2etest_${timestamp}_${random}@gmail.com`;
}

/**
 * Generate random test username
 */
export function generateTestUsername(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `e2e_user_${timestamp}_${random}`;
}

/**
 * Clean up test user (optional, for cleanup after tests)
 */
export async function cleanupTestUser(email: string): Promise<void> {
  try {
    await fetch(`${API_URL}/admin/test/cleanup-user`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
  } catch (error) {
    console.error('Failed to cleanup test user:', error);
  }
}

/**
 * Wait for element with retry logic
 */
export async function waitForCondition(
  condition: () => Promise<boolean>,
  timeoutMs: number = 10000,
  intervalMs: number = 500
): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    if (await condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  return false;
}
