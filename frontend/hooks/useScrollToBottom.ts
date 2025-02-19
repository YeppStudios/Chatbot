import { useEffect, useRef } from "react";

export const useScrollToBottom = (
  dependencies: unknown[],
  options: ScrollIntoViewOptions = { behavior: "smooth" }
) => {
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    elementRef.current?.scrollIntoView(options);
  }, [options, dependencies]);

  return elementRef;
};
