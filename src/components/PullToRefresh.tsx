import { useEffect, useRef, useState, type ReactNode } from "react";

interface Props {
  onRefresh: () => Promise<unknown> | void;
  children: ReactNode;
  threshold?: number;
}

/** iOS-style pull-to-refresh. Only activates when scrolled to top. */
export function PullToRefresh({ onRefresh, children, threshold = 72 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function onStart(e: TouchEvent) {
      if (window.scrollY > 0) return;
      startY.current = e.touches[0].clientY;
    }
    function onMove(e: TouchEvent) {
      if (startY.current == null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0) setPull(Math.min(dy * 0.5, threshold * 1.5));
    }
    async function onEnd() {
      if (pull >= threshold && !refreshing) {
        setRefreshing(true);
        try { await onRefresh(); } finally { setRefreshing(false); }
      }
      setPull(0);
      startY.current = null;
    }
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: true });
    el.addEventListener("touchend", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
    };
  }, [pull, refreshing, onRefresh, threshold]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -32,
          left: "50%",
          transform: `translate(-50%, ${pull}px)`,
          opacity: Math.min(1, pull / threshold),
          transition: refreshing ? "none" : "opacity .2s",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            width: 28, height: 28, borderRadius: "50%",
            border: "2px solid var(--color-border)",
            borderTopColor: "var(--color-brand)",
            animation: refreshing ? "spin 0.7s linear infinite" : "none",
          }}
        />
      </div>
      <div style={{ transform: `translateY(${pull}px)`, transition: refreshing || pull === 0 ? "transform .25s" : "none" }}>
        {children}
      </div>
    </div>
  );
}
