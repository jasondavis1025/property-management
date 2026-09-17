const DEFAULT_OFFSET_PX = 32;

function scrollBehavior(): ScrollBehavior {
  if (typeof window === "undefined") return "auto";
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
}

/** Scroll the document so `id` sits below the top edge (works reliably in Firefox). */
export function scrollToElementId(
  id: string,
  behavior: ScrollBehavior = scrollBehavior(),
) {
  const el = document.getElementById(id);
  if (!el) return false;

  const y =
    el.getBoundingClientRect().top +
    window.scrollY -
    DEFAULT_OFFSET_PX;

  window.scrollTo({
    top: Math.max(0, y),
    left: 0,
    behavior,
  });

  return true;
}
