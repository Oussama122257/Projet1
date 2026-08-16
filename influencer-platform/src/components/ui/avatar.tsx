import { cn, initials } from "@/lib/utils";

/**
 * Deterministic hue per person so the same creator keeps the same colour across
 * every table and card in the product.
 */
function hueFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}

export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const dimensions = {
    xs: "size-6 text-[0.5625rem]",
    sm: "size-7 text-[0.625rem]",
    md: "size-9 text-xs",
    lg: "size-12 text-sm",
  }[size];

  if (src) {
    return (
      // Avatars come from arbitrary platform CDNs at tiny fixed sizes; the
      // next/image optimizer would add a hop without a meaningful win.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={cn(
          "shrink-0 rounded-full border border-border object-cover",
          dimensions,
          className
        )}
      />
    );
  }

  const hue = hueFor(name);

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border font-medium",
        dimensions,
        className
      )}
      style={{
        background: `hsl(${hue} 45% 16%)`,
        borderColor: `hsl(${hue} 45% 26%)`,
        color: `hsl(${hue} 70% 76%)`,
      }}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}
