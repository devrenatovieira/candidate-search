"use client";

import { useEffect, useRef, useState } from "react";

export function ProfilePhoto({ url, size, name }: { url: string; size: number; name?: string }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // An image that fails before hydration never fires onError in React — check it on mount.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed) {
    if (!name) return null;
    return (
      <span
        className="search-avatar search-avatar--fallback flex-none"
        style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
        aria-hidden
      >
        {name.trim().charAt(0).toUpperCase() || "?"}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- external TSE CDN, not a Next-optimizable local asset
    <img
      ref={ref}
      src={url}
      alt=""
      width={size}
      height={size}
      className="flex-none rounded-full border border-[var(--border-1)] object-cover"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
}
