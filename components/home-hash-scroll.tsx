"use client";

import { useEffect } from "react";
import { scrollToElementId } from "@/lib/scroll-to-element";

/** After hydration, honor `/#section` (Next.js otherwise leaves you at the top). */
export function HomeHashScroll() {
  useEffect(() => {
    function scrollFromHash() {
      const id = window.location.hash.replace(/^#/, "");
      if (!id) return;

      requestAnimationFrame(() => {
        scrollToElementId(id, "auto");
      });
    }

    scrollFromHash();
    window.addEventListener("hashchange", scrollFromHash);
    return () => window.removeEventListener("hashchange", scrollFromHash);
  }, []);

  return null;
}
