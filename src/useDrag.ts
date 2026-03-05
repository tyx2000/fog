import { useEffect, useRef, useState } from "react";

export interface DragPosition {
  x: number;
  y: number;
}

export interface DragEventPayload {
  position: DragPosition;
  delta: DragPosition;
}

type DragEvent = MouseEvent | TouchEvent;

export interface UseDragOptions {
  initialPosition?: DragPosition;
  disabled?: boolean;
  onDragStart?: (payload: DragEventPayload & { event: DragEvent }) => void;
  onDrag?: (payload: DragEventPayload & { event: DragEvent }) => void;
  onDragEnd?: (payload: DragEventPayload & { event: DragEvent }) => void;
}

interface DragStartState {
  pointer: DragPosition;
  position: DragPosition;
}

function getPointFromEvent(event: DragEvent): DragPosition | null {
  if ("touches" in event) {
    const touch = event.touches[0] ?? event.changedTouches[0];
    if (!touch) {
      return null;
    }

    return {
      x: touch.clientX,
      y: touch.clientY
    };
  }

  return {
    x: event.clientX,
    y: event.clientY
  };
}

export default function useDrag<T extends HTMLElement>(options: UseDragOptions = {}) {
  const {
    initialPosition = { x: 0, y: 0 },
    disabled = false,
    onDragStart,
    onDrag,
    onDragEnd
  } = options;

  const ref = useRef<T | null>(null);
  const [position, setPosition] = useState<DragPosition>(initialPosition);
  const [isDragging, setIsDragging] = useState(false);

  const positionRef = useRef<DragPosition>(initialPosition);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<DragStartState | null>(null);

  const onDragStartRef = useRef(onDragStart);
  const onDragRef = useRef(onDrag);
  const onDragEndRef = useRef(onDragEnd);

  useEffect(() => {
    onDragStartRef.current = onDragStart;
  }, [onDragStart]);

  useEffect(() => {
    onDragRef.current = onDrag;
  }, [onDrag]);

  useEffect(() => {
    onDragEndRef.current = onDragEnd;
  }, [onDragEnd]);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    const removeDocumentListeners = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchEnd);
    };

    const startDrag = (event: DragEvent) => {
      if (disabled) {
        return;
      }

      const point = getPointFromEvent(event);
      if (!point) {
        return;
      }

      const start = {
        pointer: point,
        position: positionRef.current
      };

      dragStartRef.current = start;
      isDraggingRef.current = true;
      setIsDragging(true);

      onDragStartRef.current?.({
        event,
        position: positionRef.current,
        delta: { x: 0, y: 0 }
      });

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      document.addEventListener("touchmove", onTouchMove);
      document.addEventListener("touchend", onTouchEnd);
      document.addEventListener("touchcancel", onTouchEnd);
    };

    const moveDrag = (event: DragEvent) => {
      if (!isDraggingRef.current || !dragStartRef.current) {
        return;
      }

      const point = getPointFromEvent(event);
      if (!point) {
        return;
      }

      const delta = {
        x: point.x - dragStartRef.current.pointer.x,
        y: point.y - dragStartRef.current.pointer.y
      };

      const nextPosition = {
        x: dragStartRef.current.position.x + delta.x,
        y: dragStartRef.current.position.y + delta.y
      };

      positionRef.current = nextPosition;
      setPosition(nextPosition);

      onDragRef.current?.({
        event,
        position: nextPosition,
        delta
      });
    };

    const endDrag = (event: DragEvent) => {
      if (!isDraggingRef.current || !dragStartRef.current) {
        return;
      }

      const delta = {
        x: positionRef.current.x - dragStartRef.current.position.x,
        y: positionRef.current.y - dragStartRef.current.position.y
      };

      onDragEndRef.current?.({
        event,
        position: positionRef.current,
        delta
      });

      dragStartRef.current = null;
      isDraggingRef.current = false;
      setIsDragging(false);
      removeDocumentListeners();
    };

    function onMouseDown(event: MouseEvent) {
      if (event.button !== 0) {
        return;
      }

      startDrag(event);
    }

    function onTouchStart(event: TouchEvent) {
      startDrag(event);
    }

    function onMouseMove(event: MouseEvent) {
      moveDrag(event);
    }

    function onTouchMove(event: TouchEvent) {
      moveDrag(event);
    }

    function onMouseUp(event: MouseEvent) {
      endDrag(event);
    }

    function onTouchEnd(event: TouchEvent) {
      endDrag(event);
    }

    const element = ref.current;
    if (!element) {
      return removeDocumentListeners;
    }

    element.addEventListener("mousedown", onMouseDown);
    element.addEventListener("touchstart", onTouchStart);

    return () => {
      element.removeEventListener("mousedown", onMouseDown);
      element.removeEventListener("touchstart", onTouchStart);
      removeDocumentListeners();
    };
  }, [disabled]);

  return {
    ref,
    position,
    isDragging,
    setPosition
  };
}
