import { LoginCard } from "@/components/auth/LoginCard";
import type { Metadata } from "next";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Login",
  description: `Melde dich bei ${BRAND_NAME} an`,
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <LoginCard />
    </div>
  );
}
