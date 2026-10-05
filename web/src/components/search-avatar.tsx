"use client";

import { useEffect, useRef, useState } from "react";

export function SearchAvatar({ photoUrl, name }: { photoUrl: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const ref = useRef<HTMLImageElement>(null);

  // An image that fails before hydration never fires onError in React — check it on mount.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (photoUrl == null || failed) {
    return (
      <span className="search-avatar search-avatar--fallback" aria-hidden>
        {initial}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- external TSE CDN, not a Next-optimizable local asset
    <img ref={ref} src={photoUrl} alt="" className="search-avatar" onError={() => setFailed(true)} />
  );
}
