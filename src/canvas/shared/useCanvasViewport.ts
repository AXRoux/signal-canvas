import { useCallback, useRef, useState, type WheelEvent } from "react";

export interface CanvasTransform {
  x: number;
  y: number;
  scale: number;
}

const MIN_SCALE = 0.35;
const MAX_SCALE = 1.6;

export function useCanvasViewport(initial: CanvasTransform = { x: 40, y: 40, scale: 1 }) {
  const [transform, setTransform] = useState(initial);
  const panRef = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null);

  const onWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? 0.92 : 1.08;
    setTransform((t) => {
      const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, t.scale * delta));
      const ratio = nextScale / t.scale;
      return {
        scale: nextScale,
        x: mx - (mx - t.x) * ratio,
        y: my - (my - t.y) * ratio,
      };
    });
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    panRef.current = { x: e.clientX, y: e.clientY, originX: transform.x, originY: transform.y };
  }, [transform.x, transform.y]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!panRef.current) return;
    setTransform((t) => ({
      ...t,
      x: panRef.current!.originX + (e.clientX - panRef.current!.x),
      y: panRef.current!.originY + (e.clientY - panRef.current!.y),
    }));
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    panRef.current = null;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const zoomIn = useCallback(() => {
    setTransform((t) => ({ ...t, scale: Math.min(MAX_SCALE, t.scale * 1.12) }));
  }, []);

  const zoomOut = useCallback(() => {
    setTransform((t) => ({ ...t, scale: Math.max(MIN_SCALE, t.scale * 0.88) }));
  }, []);

  const resetView = useCallback(() => {
    setTransform(initial);
  }, [initial]);

  return {
    transform,
    setTransform,
    onWheel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    zoomIn,
    zoomOut,
    resetView,
  };
}
