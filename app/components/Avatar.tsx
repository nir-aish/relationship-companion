/* eslint-disable @next/next/no-img-element */

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "·";
}

const sizes = {
  sm: "h-9 w-9 text-[13px]",
  md: "h-12 w-12 text-base",
  lg: "h-16 w-16 text-lg",
} as const;

export function Avatar({
  name,
  photo,
  size = "sm",
}: {
  name: string;
  photo?: string | null;
  size?: keyof typeof sizes;
}) {
  return (
    <span
      className={`${sizes[size]} shrink-0 inline-flex items-center justify-center overflow-hidden rounded-full bg-cream-deep font-serif text-ink-soft ring-1 ring-line`}
    >
      {photo ? (
        <img
          src={photo}
          alt={name}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span aria-hidden>{initials(name)}</span>
      )}
    </span>
  );
}
