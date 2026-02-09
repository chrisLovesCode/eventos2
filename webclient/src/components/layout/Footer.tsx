"use client";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const buildTimestamp = process.env.NEXT_PUBLIC_BUILD_TIMESTAMP || "unknown";

  return (
    <footer className="border-t border-border bg-surface/50 backdrop-blur-sm mt-16 text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center gap-2 text-sm ">
          <div className="flex items-center gap-2">
            <span>© {currentYear}</span>
            <a
              href="https://github.com/chrisLovesCode/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-white hover:underline"
            >
              Chris Vaupel
            </a>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/80">
            <span>Last Build</span>
            <code className="font-mono text-white/80">
              {buildTimestamp}
            </code>
          </div>
        </div>
      </div>
    </footer>
  );
}
