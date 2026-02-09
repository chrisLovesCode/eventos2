import type { UserBasic } from "@/types/event";

export async function getCurrentUser(): Promise<UserBasic | null> {
  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as UserBasic;
    return data ?? null;
  } catch {
    return null;
  }
}
