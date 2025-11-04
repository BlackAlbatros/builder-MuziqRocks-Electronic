import { useEffect, useState } from "react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";

const LOGO_URL =
  "https://cdn.builder.io/api/v1/image/assets%2F86cecfe73f914f2393fc7c63dbac01cd%2Fc7a955aed0934183a2ab1db1191f7447?format=webp&width=800";

export function Header() {
  const location = useLocation();
  // Hide header on watch pages
  if (location.pathname && location.pathname.startsWith("/watch")) {
    return null;
  }

  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const navigate = useNavigate();
  useEffect(() => {
    setQ(params.get("q") ?? "");
  }, [params]);

  function applySearch(value: string) {
    setQ(value);
    navigate(
      { pathname: "/", search: value ? `?q=${encodeURIComponent(value)}` : "" },
      { replace: true },
    );
  }

  const headerEl = (
    <header
      className={`fixed top-0 left-0 right-0 z-40 border-b backdrop-blur supports-[backdrop-filter]:bg-background/80 bg-background/70`}
      style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000 }}
    >
      <div className="container mx-auto flex items-center gap-3 py-3">
        <div className="flex items-center">
          <img
            src={LOGO_URL}
            alt="Muziq.Rocks"
            className="h-12 w-auto md:h-14"
          />
        </div>
        <form
          className="ml-auto w-full max-w-md"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            applySearch(q);
          }}
        >
          <input
            type="search"
            value={q}
            onChange={(e) => applySearch(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" ||
                e.key === "Go" ||
                e.key === "Search" ||
                e.key === "Select"
              ) {
                e.preventDefault();
                applySearch((e.target as HTMLInputElement).value);
              }
            }}
            placeholder="Search titles and descriptions…"
            autoCorrect="off"
            autoCapitalize="none"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            aria-label="Search videos"
          />
        </form>
      </div>
    </header>
  );

  if (typeof document === "undefined") return null;
  return createPortal(headerEl, document.body);
}
