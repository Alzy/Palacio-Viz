'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';

export interface MyKnobHeadlessProps {
  /** Initial value when uncontrolled */
  initialValue?: number;
  /** Controlled value. If provided, component is controlled. */
  value?: number;
  /** High-freq callback during drag (rAF-paced) */
  onChange?: (value: number) => void;
  /** Final commit on drag end */
  onChangeEnd?: (value: number) => void;
  /** Minimum value (default: 0) */
  valueMin?: number;
  /** Maximum value (default: 1) */
  valueMax?: number;
  /** Drag sensitivity (default: 0.01) */
  dragSensitivity?: number;
  /** Whether the knob is disabled */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
  /** Custom style */
  style?: React.CSSProperties;
  /** Aria label */
  'aria-label'?: string;
  /** Children (visual knob content) - can be ReactNode or render prop */
  children?: React.ReactNode | ((displayValue: number) => React.ReactNode);
}

const MyKnobHeadless: React.FC<MyKnobHeadlessProps> = ({
  initialValue = 0,
  value,
  onChange,
  onChangeEnd,
  valueMin = 0,
  valueMax = 1,
  dragSensitivity = 0.01,
  disabled = false,
  className = '',
  style = {},
  'aria-label': ariaLabel,
  children,
}) => {
  const divRef = useRef<HTMLDivElement>(null);

  const isControlled = value !== undefined;
  const [displayValue, setDisplayValue] = useState(value ?? initialValue);

  const isDraggingRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const startValueRef = useRef(0);
  const startYRef = useRef(0);

  // rAF throttling for onChange (like XYControl)
  const pendingRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const pump = useCallback(() => {
    rafRef.current = null;
    const p = pendingRef.current;
    if (p !== null && onChange) onChange(p);
    pendingRef.current = null;
  }, [onChange]);

  const schedule = useCallback((newValue: number) => {
    pendingRef.current = newValue;
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(pump);
    }
  }, [pump]);

  useEffect(() => () => { if (rafRef.current != null) cancelAnimationFrame(rafRef.current); }, []);

  // Sync controlled value only when not dragging to avoid cursor fights (like XYControl)
  useEffect(() => {
    if (isControlled && !isDraggingRef.current && value !== undefined) {
      setDisplayValue(value);
    }
  }, [isControlled, value]);

  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || !divRef.current) return;
    e.preventDefault();
    divRef.current.setPointerCapture(e.pointerId);
    activePointerIdRef.current = e.pointerId;
    isDraggingRef.current = true;

    // Store starting values
    startValueRef.current = displayValue;
    startYRef.current = e.clientY;

    // Focus for accessibility
    divRef.current.focus();
  }, [disabled, displayValue]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || e.pointerId !== activePointerIdRef.current) return;

    // Calculate delta based on vertical mouse movement (like traditional knobs)
    const deltaY = startYRef.current - e.clientY; // Inverted: up = positive
    const deltaValue = deltaY * dragSensitivity * (valueMax - valueMin);
    
    const newValue = clamp(startValueRef.current + deltaValue, valueMin, valueMax);
    
    setDisplayValue(newValue);  // Immediate visual feedback (like XYControl)
    schedule(newValue);         // rAF-paced onChange (like XYControl)
  }, [dragSensitivity, valueMin, valueMax, schedule]);

  const endDrag = useCallback((e?: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    try {
      if (e && divRef.current) divRef.current.releasePointerCapture(e.pointerId);
    } catch {}
    isDraggingRef.current = false;
    activePointerIdRef.current = null;

    // Flush any pending onChange and fire onChangeEnd (like XYControl)
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const final = pendingRef.current ?? displayValue;
    if (onChange) onChange(final);
    if (onChangeEnd) onChangeEnd(final);
    pendingRef.current = null;
  }, [displayValue, onChange, onChangeEnd]);

  // Normalize to 0-1 for accessibility
  const normalizedValue = (displayValue - valueMin) / (valueMax - valueMin);

  return (
    <div
      ref={divRef}
      role="slider"
      aria-valuenow={displayValue}
      aria-valuemin={valueMin}
      aria-valuemax={valueMax}
      aria-valuetext={displayValue.toFixed(3)}
      aria-label={ariaLabel}
      tabIndex={disabled ? -1 : 0}
      className={`select-none ${className}`}
      style={{
        touchAction: 'none', // Prevent scrolling during drag
        cursor: disabled ? 'not-allowed' : 'ns-resize',
        ...style,
      }}
      onPointerDownCapture={onPointerDown}
      onPointerMoveCapture={onPointerMove}
      onPointerUpCapture={endDrag}
      onPointerCancelCapture={endDrag}
      onLostPointerCapture={endDrag}
    >
      {typeof children === 'function' ? children(displayValue) : children}
    </div>
  );
};

export default MyKnobHeadless;