"use client";

import { scrollToElementId } from "@/lib/scroll-to-element";

type ScrollToIdLinkProps = {
  id: string;
  className?: string;
  children: React.ReactNode;
};

export function ScrollToIdLink({ id, className, children }: ScrollToIdLinkProps) {
  function handleClick() {
    if (!scrollToElementId(id)) return;
    window.history.pushState(null, "", `#${id}`);
  }

  return (
    <button type="button" onClick={handleClick} className={`cursor-pointer ${className ?? ""}`}>
      {children}
    </button>
  );
}
