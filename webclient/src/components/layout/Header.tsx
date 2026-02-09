"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightFromBracket, faPlus } from "@fortawesome/free-solid-svg-icons";
import { Button, Modal } from "@/components/commons";
import { getCurrentUser } from "@/utils/auth";

export function Header() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    // Check login status
    const loadUser = async () => {
      const userData = await getCurrentUser();
      setIsLoggedIn(!!userData);
    };
    loadUser();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setIsSticky(window.scrollY > 20);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore logout errors
    }
    setIsLoggedIn(false);
    router.push("/");
    router.refresh();
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    handleLogout();
  };

  return (
    <header
      className={
        "inset-x-0 top-0 z-50 transition-all duration-300 " +
        (isSticky
          ? "header-sticky"
          : "absolute bg-linear-to-b from-background/90 via-background/40 to-transparent")
      }
    >
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="TechEvents"
                width={360}
                height={90}
                className="h-8 w-auto sm:h-10"
                priority
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
              />
            </Link>
          </div>

          <nav className="hidden md:flex" aria-label="Primary" />

          <div className="flex items-center gap-2 sm:gap-3">
            {isLoggedIn ? (
              <>
                <div className="flex items-center gap-2 sm:hidden">
                  <Link href="/events/create" className="inline-flex items-center">
                    <Button variant="success" aria-label="Event eintragen">
                      <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={confirmLogout}
                    aria-label="Abmelden"
                  >
                    <FontAwesomeIcon icon={faRightFromBracket} className="h-4 w-4" />
                  </Button>
                </div>

                <div className="hidden items-center gap-3 sm:flex">
                  <Link href="/events/create" className="inline-flex items-center">
                    <Button variant="success">
                      <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
                      Event eintragen
                    </Button>
                  </Link>
                  <Button variant="outline" onClick={confirmLogout}>
                    <FontAwesomeIcon icon={faRightFromBracket} className="h-4 w-4" />
                    Abmelden
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="inline-flex items-center">
                  <Button variant="outline">Anmelden</Button>
                </Link>
                <Link href="/register" className="inline-flex items-center">
                  <Button>Registrieren</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={showLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
        title="Abmelden"
        description="Moechtest du dich wirklich abmelden?"
        confirmText="Abmelden"
        cancelText="Abbrechen"
      />
    </header>
  );
}
