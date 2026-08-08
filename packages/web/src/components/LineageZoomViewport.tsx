"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type WheelEvent as ReactWheelEvent,
} from "react";

const ZOOM_MIN = 0.45;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.12;

function ZoomOutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden focusable="false">
      <circle cx="6" cy="6" r="4.25" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <path d="M9.25 9.25L12 12" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M4 6h4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function ZoomInIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden focusable="false">
      <circle cx="6" cy="6" r="4.25" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <path d="M9.25 9.25L12 12" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M4 6h4M6 4v4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden focusable="false">
      <path
        d="M7 2.5a4.5 4.5 0 1 1-3.18 7.68"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M2.5 2.5v2.75h2.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LineageZoomViewport({
  children,
  resetKey,
  variant = "tree",
}: {
  children: ReactNode;
  resetKey?: string;
  variant?: "tree" | "overview";
}) {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ active: boolean; x: number; y: number; panX: number; panY: number }>({
    active: false,
    x: 0,
    y: 0,
    panX: 0,
    panY: 0,
  });

  const clampScale = useCallback(
    (value: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value)),
    [],
  );

  const zoomBy = useCallback(
    (delta: number) => {
      setScale((current) => clampScale(Number((current + delta).toFixed(2))));
    },
    [clampScale],
  );

  const resetView = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (resetKey !== undefined) {
      resetView();
    }
  }, [resetKey, resetView]);

  const handleWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      zoomBy(event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP);
    },
    [zoomBy],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      const target = event.target as HTMLElement;
      if (target.closest("a, button, .lineage-zoom-controls")) return;

      dragRef.current = {
        active: true,
        x: event.clientX,
        y: event.clientY,
        panX: pan.x,
        panY: pan.y,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [pan.x, pan.y],
  );

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    setPan({
      x: dragRef.current.panX + (event.clientX - dragRef.current.x),
      y: dragRef.current.panY + (event.clientY - dragRef.current.y),
    });
  }, []);

  const handlePointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current.active = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  return (
    <div
      className={`lineage-zoom-wrap${variant === "overview" ? " lineage-zoom-wrap--overview" : ""}`}
    >
      <div
        className={`lineage-v-scroll lineage-v-scroll--zoom${variant === "overview" ? " lineage-v-scroll--zoom-overview" : ""}`}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          className="lineage-zoom-inner"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          }}
        >
          {children}
        </div>

        <div className="lineage-zoom-controls" role="toolbar" aria-label="系統図の表示操作">
          <button
            type="button"
            className="lineage-zoom-controls-btn"
            aria-label="縮小"
            onClick={() => zoomBy(-ZOOM_STEP)}
          >
            <ZoomOutIcon />
          </button>
          <span className="lineage-zoom-controls-level" aria-live="polite">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            className="lineage-zoom-controls-btn"
            aria-label="拡大"
            onClick={() => zoomBy(ZOOM_STEP)}
          >
            <ZoomInIcon />
          </button>
          <span className="lineage-zoom-controls-sep" aria-hidden />
          <button
            type="button"
            className="lineage-zoom-controls-btn"
            aria-label="表示をリセット"
            title="表示をリセット"
            onClick={resetView}
          >
            <ResetIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
