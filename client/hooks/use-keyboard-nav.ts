import { useEffect, useRef } from "react";

export function useKeyboardNav(itemIds: string[]) {
  const focusedIndexRef = useRef(0);
  const itemRefsRef = useRef<Record<string, HTMLAnchorElement | null>>({});

  useEffect(() => {
    // Focus first item on mount
    if (itemIds.length > 0) {
      focusedIndexRef.current = 0;
      const firstItem = itemRefsRef.current[itemIds[0]];
      firstItem?.focus();
    }
  }, [itemIds]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const validKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
      if (!validKeys.includes(e.key)) return;

      e.preventDefault();

      let newIndex = focusedIndexRef.current;
      const itemsPerRow = 3; // Default for md:grid-cols-3

      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        newIndex = Math.max(0, newIndex - 1);
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        newIndex = Math.min(itemIds.length - 1, newIndex + 1);
      }

      focusedIndexRef.current = newIndex;
      const nextItem = itemRefsRef.current[itemIds[newIndex]];
      nextItem?.focus();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [itemIds]);

  return {
    setRef: (id: string, ref: HTMLAnchorElement | null) => {
      itemRefsRef.current[id] = ref;
    },
    isFocused: (id: string) => {
      return itemIds[focusedIndexRef.current] === id;
    },
  };
}
