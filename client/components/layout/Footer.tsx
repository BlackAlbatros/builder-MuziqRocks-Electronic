import React from "react";

export function Footer() {
  return (
    <footer style={{ backgroundColor: '#f8a11b' }} className="mt-10 text-black">
      <div className="container mx-auto px-4 py-4 flex items-center justify-center gap-6">
        <a
          href="https://music.apple.com/md/artist/muziqrocks/1824742571"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Apple Music"
          className="hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-black rounded"
        >
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2F75422943980645d28df141712104f45a%2Fd51bd553057345ec8d8d269538d4f2f7?format=webp&width=800"
            alt="Apple Music"
            className="h-8 w-8 object-contain"
          />
        </a>
        <a
          href="https://open.spotify.com/artist/11Bk21ABuYiZYnhizitHFi"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Spotify"
          className="hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-black rounded"
        >
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2F75422943980645d28df141712104f45a%2F2923bdc86548498bb9dd2ac54ba08498?format=webp&width=800"
            alt="Spotify"
            className="h-8 w-8 object-contain"
          />
        </a>
        <a
          href="https://www.youtube.com/@MuziqRocksChannel"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="YouTube"
          className="hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-black rounded"
        >
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2F75422943980645d28df141712104f45a%2F78df621bcda64d0c97b4a559c40f6104?format=webp&width=800"
            alt="YouTube"
            className="h-8 w-8 object-contain"
          />
        </a>
        <a
          href="https://music.amazon.co.uk/artists/B0FGS912GX"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Amazon Music"
          className="hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-black rounded"
        >
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2F75422943980645d28df141712104f45a%2Fc0aa7e2fd9d14d76a5e39c2f5001b6b6?format=webp&width=800"
            alt="Amazon Music"
            className="h-8 w-8 object-contain"
          />
        </a>
      </div>
      <div className="border-t border-black/10">
        <div className="container mx-auto px-4 py-3 text-center text-sm text-black">
          © 2025 MuziqRocks. All rights reserved. Powered by Muziq.Rocks
        </div>
      </div>
    </footer>
  );
}
