import { useEffect } from "react";

export const useVisibilityScrolling = (
  targetRef: React.RefObject<HTMLDivElement | null>
) => {
  useEffect(() => {
    const scrollToTarget = () => {
      targetRef.current?.scrollIntoView();
    };

    scrollToTarget();

    document.addEventListener("visibilitychange", scrollToTarget);

    return () => {
      document.removeEventListener("visibilitychange", scrollToTarget);
    };
  }, [targetRef]);
};
