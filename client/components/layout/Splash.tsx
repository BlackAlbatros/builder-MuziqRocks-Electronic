import { useEffect, useState } from "react";

const LOGO_URL =
  "https://cdn.builder.io/api/v1/image/assets%2F86cecfe73f914f2393fc7c63dbac01cd%2F5edf1caedd8f4c8392fed5a48727d373?format=webp&width=800";

export function Splash() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 1200);
    return () => clearTimeout(t);
  }, []);
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-background to-black/70">
      <div className="flex flex-col items-center gap-6">
        <img
          src={LOGO_URL}
          alt="Muziq.Rocks logo"
          className="h-28 w-28 sm:h-36 sm:w-36 drop-shadow-2xl"
        />
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide text-primary">
          Muziq.Rocks – Electronic Music
        </h1>
      </div>
    </div>
  );
}
