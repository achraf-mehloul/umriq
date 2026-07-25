import { useRef, useState, type ReactNode } from "react";

interface Action { label: string; color: string; onClick: () => void }
interface Props { children: ReactNode; left?: Action; right?: Action; width?: number }

/** iOS-style swipe reveal. Drag horizontally to expose one hidden action per side. */
export function SwipeActions({ children, left, right, width = 88 }: Props) {
  const startX = useRef<number | null>(null);
  const [dx, setDx] = useState(0);

  function onStart(e: React.TouchEvent) { startX.current = e.touches[0].clientX; }
  function onMove(e: React.TouchEvent) {
    if (startX.current == null) return;
    let d = e.touches[0].clientX - startX.current;
    if (!left && d > 0) d = 0;
    if (!right && d < 0) d = 0;
    setDx(Math.max(-width, Math.min(width, d)));
  }
  function onEnd() {
    if (Math.abs(dx) > width * 0.6) {
      if (dx < 0 && right) right.onClick();
      else if (dx > 0 && left) left.onClick();
    }
    setDx(0);
    startX.current = null;
  }

  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      {left && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "flex-start", paddingInlineStart: 16, background: left.color, color: "white", fontWeight: 600 }}>{left.label}</div>
      )}
      {right && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingInlineEnd: 16, background: right.color, color: "white", fontWeight: 600 }}>{right.label}</div>
      )}
      <div
        onTouchStart={onStart}
        onTouchMove={onMove}
        onTouchEnd={onEnd}
        style={{ transform: `translateX(${dx}px)`, transition: dx === 0 ? "transform .25s ease" : "none", position: "relative", background: "var(--color-bg)" }}
      >
        {children}
      </div>
    </div>
  );
}
