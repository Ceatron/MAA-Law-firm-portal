import React, { useState, useRef, useCallback, useEffect, type CSSProperties, type PointerEvent } from 'react';

interface UseDraggableOptions {
  isOpen?: boolean;
}

export function useDraggable(options: UseDraggableOptions = {}) {
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const elementStartPosRef = useRef({ x: 0, y: 0 });

  // Reset position whenever modal opens or closes
  useEffect(() => {
    if (options.isOpen !== undefined) {
      setPosition({ x: 0, y: 0 });
    }
  }, [options.isOpen]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Only primary left click
    if (e.button !== 0) return;

    // Do not initiate drag if user interacted with a clickable or form element
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.closest('button, input, select, textarea, a, label, [role="button"]') ||
        target.hasAttribute('data-no-drag'))
    ) {
      return;
    }

    isDraggingRef.current = true;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    elementStartPosRef.current = { ...position };

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture is not supported
    }
  }, [position]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartPosRef.current.x;
    const dy = e.clientY - dragStartPosRef.current.y;
    setPosition({
      x: elementStartPosRef.current.x + dx,
      y: elementStartPosRef.current.y + dy,
    });
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  }, []);

  const resetPosition = useCallback(() => {
    setPosition({ x: 0, y: 0 });
  }, []);

  return {
    position,
    handleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      className: 'cursor-grab active:cursor-grabbing select-none',
      style: { touchAction: 'none' } as React.CSSProperties,
    },
    modalStyle: {
      transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
      transition: isDraggingRef.current ? 'none' : 'transform 0.05s ease-out',
    } as React.CSSProperties,
    resetPosition,
  };
}
