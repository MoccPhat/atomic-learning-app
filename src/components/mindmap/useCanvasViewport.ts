import { useState, useCallback, useRef, useEffect } from 'react';
import { CanvasViewport } from '../../lib/mindmap-types';

interface UseCanvasViewportOptions {
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export function useCanvasViewport(options?: UseCanvasViewportOptions) {
  const minZoom = options?.minZoom ?? 0.2;
  const maxZoom = options?.maxZoom ?? 3.0;

  const internalRef = useRef<HTMLDivElement>(null);
  const containerRef = options?.containerRef ?? internalRef;

  const [viewport, setViewport] = useState<CanvasViewport>({
    x: 0,
    y: 0,
    zoom: options?.initialZoom ?? 1,
  });

  const isPanningRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const touchDistanceRef = useRef<number | null>(null);

  // Chuyển đổi toạ độ màn hình (Screen) sang toạ độ không gian sơ đồ (World)
  const screenToWorld = useCallback(
    (screenX: number, screenY: number, containerRect: DOMRect): { x: number; y: number } => {
      const relX = screenX - containerRect.left;
      const relY = screenY - containerRect.top;
      // Trọng tâm viewBox ở (containerWidth/2, containerHeight/2)
      const centerX = containerRect.width / 2;
      const centerY = containerRect.height / 2;

      return {
        x: (relX - centerX - viewport.x) / viewport.zoom,
        y: (relY - centerY - viewport.y) / viewport.zoom,
      };
    },
    [viewport]
  );

  // Bắt đầu pan chuột
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Chỉ kích hoạt pan khi bấm chuột trái (button === 0) và không bấm vào các interactive element
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-no-pan]')) return;

    isPanningRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  // Di chuyển pan chuột
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanningRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    setViewport((prev) => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy,
    }));
  }, []);

  // Kết thúc pan chuột
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // bỏ qua nếu đã tự release
      }
    }
  }, []);

  // Gắn Native Wheel Listener với { passive: false } trực tiếp vào container DOM element.
  // Điều này giải quyết triệt để lỗi React 18 passive listener:
  // 1. Ngăn chặn toàn bộ lệnh zoom giao diện web của trình duyệt khi người dùng Ctrl + Wheel hoặc dùng Touchpad pinch.
  // 2. Ngăn cuộn trang ngoài và cô lập hoàn toàn zoom bên trong vùng Canvas Mindmap.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleNativeWheel = (e: WheelEvent) => {
      // BẮT BUỘC: Ngăn trình duyệt zoom toàn bộ trang web
      e.preventDefault();
      e.stopPropagation();

      let zoomFactor: number;
      if (e.ctrlKey) {
        // Cử chỉ pinch 2 ngón trên Precision Touchpad hoặc Ctrl + cuộn chuột
        zoomFactor = Math.exp(-e.deltaY * 0.01);
      } else {
        // Con lăn chuột thông thường
        zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
      }

      setViewport((prev) => {
        const nextZoom = Math.min(maxZoom, Math.max(minZoom, prev.zoom * zoomFactor));
        if (Math.abs(nextZoom - prev.zoom) < 0.0001) return prev;

        // Thu phóng hội tụ chuẩn xác theo vị trí con trỏ chuột
        const rect = el.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const dx = mouseX - centerX;
        const dy = mouseY - centerY;

        const ratio = nextZoom / prev.zoom;
        const newX = dx - (dx - prev.x) * ratio;
        const newY = dy - (dy - prev.y) * ratio;

        return {
          x: newX,
          y: newY,
          zoom: nextZoom,
        };
      });
    };

    // { passive: false } là điều kiện tiên quyết để e.preventDefault() có hiệu lực!
    el.addEventListener('wheel', handleNativeWheel, { passive: false });

    return () => {
      el.removeEventListener('wheel', handleNativeWheel);
    };
  }, [containerRef, minZoom, maxZoom]);

  // Gắn Native Touch Listeners với { passive: false } để ngăn ngừa Mobile Browser viewport zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleNativeTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        touchDistanceRef.current = dist;
      }
    };

    const handleNativeTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && touchDistanceRef.current !== null) {
        // Ngăn trình duyệt di động zoom trang web
        e.preventDefault();
        e.stopPropagation();

        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = dist / touchDistanceRef.current;
        touchDistanceRef.current = dist;

        setViewport((prev) => ({
          ...prev,
          zoom: Math.min(maxZoom, Math.max(minZoom, prev.zoom * factor)),
        }));
      }
    };

    const handleNativeTouchEnd = () => {
      touchDistanceRef.current = null;
    };

    el.addEventListener('touchstart', handleNativeTouchStart, { passive: true });
    el.addEventListener('touchmove', handleNativeTouchMove, { passive: false });
    el.addEventListener('touchend', handleNativeTouchEnd, { passive: true });
    el.addEventListener('touchcancel', handleNativeTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleNativeTouchStart);
      el.removeEventListener('touchmove', handleNativeTouchMove);
      el.removeEventListener('touchend', handleNativeTouchEnd);
      el.removeEventListener('touchcancel', handleNativeTouchEnd);
    };
  }, [containerRef, minZoom, maxZoom]);

  const zoomIn = useCallback(() => {
    setViewport((prev) => ({
      ...prev,
      zoom: Math.min(maxZoom, prev.zoom * 1.25),
    }));
  }, [maxZoom]);

  const zoomOut = useCallback(() => {
    setViewport((prev) => ({
      ...prev,
      zoom: Math.max(minZoom, prev.zoom * 0.8),
    }));
  }, [minZoom]);

  const resetViewport = useCallback(() => {
    setViewport({ x: 0, y: 0, zoom: 1 });
  }, []);

  const setCenterPosition = useCallback((x: number, y: number, zoom?: number) => {
    setViewport((prev) => ({
      x,
      y,
      zoom: zoom ?? prev.zoom,
    }));
  }, []);

  return {
    viewport,
    screenToWorld,
    containerRef,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
    },
    zoomIn,
    zoomOut,
    resetViewport,
    setCenterPosition,
  };
}
