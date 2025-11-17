import { Globe } from "lucide-react";

export const Footer = () => {
  const links = [
    {
      name: "Site",
      url: "https://muziq.rocks",
      icon: Globe,
      label: "Muziq.Rocks",
    },
    {
      name: "Apple Music",
      url: "https://music.apple.com/md/artist/muziqrocks/1824742571",
      image:
        "https://cdn.builder.io/api/v1/image/assets%2F671f0028cbd84e92ae00beab08c4b172%2Fa6e8b0af77c74aec83a77e183e0484ed?format=webp&width=800",
      label: "MuziqRocks",
    },
    {
      name: "Spotify",
      url: "https://open.spotify.com/artist/11Bk21ABuYiZYnhizitHFi",
      image:
        "https://cdn.builder.io/api/v1/image/assets%2F671f0028cbd84e92ae00beab08c4b172%2F066b7fa742254991899da57f80b1542d?format=webp&width=800",
      label: "MuziqRocks",
    },
    {
      name: "YouTube",
      url: "https://www.youtube.com/@MuziqRocksChannel",
      image:
        "https://cdn.builder.io/api/v1/image/assets%2F671f0028cbd84e92ae00beab08c4b172%2F57d9f8495c314eceab78677c130e7001?format=webp&width=800",
      label: "MuziqRocks",
    },
    {
      name: "Amazon Music",
      url: "https://music.amazon.co.uk/artists/B0FGS912GX/muziqrocks",
      image:
        "https://cdn.builder.io/api/v1/image/assets%2F671f0028cbd84e92ae00beab08c4b172%2Fac550674469649f7ba67ba5048fa7369?format=webp&width=800",
      label: "MuziqRocks",
    },
  ];

  return (
    <footer className="bg-primary text-primary-foreground py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap gap-8 justify-center items-center">
          {links.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
              aria-label={`${link.name}: ${link.label}`}
            >
              {link.image ? (
                <img
                  src={link.image}
                  alt={link.name}
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
              ) : (
                <link.icon size={32} strokeWidth={1.5} />
              )}
              <span className="text-sm font-medium">{link.label}</span>
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};
