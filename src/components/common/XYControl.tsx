'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';

export interface XYControlProps {
  /** Initial value when uncontrolled (default: {x: .5, y: .5}) */
  initialValue?: { x: number; y: number };
  /** Controlled value (0..1 space). If provided, component is controlled. */
  value?: { x: number; y: number };
  /** High-freq callback during drag (rAF-paced) */
  onChange?: (value: { x: number; y: number }) => void;
  /** Final commit on drag end (optional) */
  onChangeEnd?: (value: { x: number; y: number }) => void;
  className?: string;
  disabled?: boolean;
  gridLines?: number;
  xTitle?: string;
  yTitle?: string;
}

const XYControl: React.FC<XYControlProps> = ({
  initialValue = { x: 0.5, y: 0.5 },
  value,
  onChange,
  onChangeEnd,
  className = '',
  disabled = false,
  gridLines = 4,
  xTitle,
  yTitle,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const isControlled = value !== undefined;
  const [displayPos, setDisplayPos] = useState(value ?? initialValue);

  const isDraggingRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const rectRef = useRef<DOMRect | null>(null);

  // rAF throttling for onChange
  const pendingRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  const pump = useCallback(() => {
    rafRef.current = null;
    const p = pendingRef.current;
    if (p && onChange) onChange(p);
    pendingRef.current = null;
  }, [onChange]);

  const schedule = useCallback((p: { x: number; y: number }) => {
    pendingRef.current = p;
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(pump);
    }
  }, [pump]);

  useEffect(() => () => { if (rafRef.current != null) cancelAnimationFrame(rafRef.current); }, []);

  // Sync controlled value only when not dragging to avoid cursor fights
  useEffect(() => {
    if (isControlled && !isDraggingRef.current && value) {
      setDisplayPos(value);
    }
  }, [isControlled, value]);

  const getPosFromClient = (cx: number, cy: number) => {
    const r = rectRef.current!;
    const x = Math.max(0, Math.min(1, (cx - r.left) / r.width));
    const y = Math.max(0, Math.min(1, 1 - (cy - r.top) / r.height));
    return { x, y };
  };

  const onPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (disabled || !svgRef.current) return;
    e.preventDefault();
    rectRef.current = svgRef.current.getBoundingClientRect();
    svgRef.current.setPointerCapture(e.pointerId);
    activePointerIdRef.current = e.pointerId;
    isDraggingRef.current = true;

    const p = getPosFromClient(e.clientX, e.clientY);
    setDisplayPos(p);          // visual feedback
    schedule(p);               // rAF-paced onChange
  }, [disabled, schedule]);

  const onPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDraggingRef.current || e.pointerId !== activePointerIdRef.current) return;
    const p = getPosFromClient(e.clientX, e.clientY);
    setDisplayPos(p);
    schedule(p);
  }, [schedule]);

  const endDrag = useCallback((e?: React.PointerEvent<SVGSVGElement>) => {
    if (!isDraggingRef.current) return;
    try {
      if (e && svgRef.current) svgRef.current.releasePointerCapture(e.pointerId);
    } catch {}
    isDraggingRef.current = false;
    activePointerIdRef.current = null;
    rectRef.current = null;

    // Flush any pending onChange and fire onChangeEnd
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const final = pendingRef.current ?? displayPos;
    if (onChange) onChange(final);
    if (onChangeEnd) onChangeEnd(final);
    pendingRef.current = null;
  }, [displayPos, onChange, onChangeEnd]);

  const SVG = 300;
  const px = displayPos.x * SVG;
  const py = (1 - displayPos.y) * SVG;

  const grid = Array.from({ length: gridLines }, (_, i) => (i + 1) / (gridLines + 1) * SVG);

  return (
    <div className={`w-full h-full min-h-[200px] ${className}`}>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${SVG} ${SVG}`}
        preserveAspectRatio="xMidYMid meet"
        className={`border border-border rounded-lg select-none touch-none ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-crosshair'}`}
        style={{ aspectRatio: '1', maxWidth: '100%', maxHeight: '100%' }}
        onPointerDownCapture={onPointerDown}
        onPointerMoveCapture={onPointerMove}
        onPointerUpCapture={endDrag}
        onPointerCancelCapture={endDrag}
        onLostPointerCapture={endDrag}
      >
        <rect width={SVG} height={SVG} className="fill-muted" />
        {grid.map((g, i) => (
          <g key={i} opacity="0.2" className="stroke-foreground">
            <line x1={g} y1={0} x2={g} y2={SVG} strokeWidth="1" />
            <line x1={0} y1={g} x2={SVG} y2={g} strokeWidth="1" />
          </g>
        ))}
        <line x1={SVG / 2} y1={0} x2={SVG / 2} y2={SVG} className="stroke-foreground" opacity="0.35" />
        <line x1={0} y1={SVG / 2} x2={SVG} y2={SVG / 2} className="stroke-foreground" opacity="0.35" />
        <circle cx={px} cy={py} r="10" className="fill-primary stroke-background" strokeWidth="3" />
        <text x={10} y={SVG - 10} className="pointer-events-none select-none fill-muted-foreground" fontSize="11" fontFamily="monospace">
          X: {displayPos.x.toFixed(3)}  Y: {displayPos.y.toFixed(3)}
        </text>
        {xTitle && (
          <text x={SVG / 2} y={SVG - 26} textAnchor="middle" className="fill-muted-foreground">{xTitle}</text>
        )}
        {yTitle && (
          <text x={18} y={SVG / 2} textAnchor="middle" transform={`rotate(-90, 18, ${SVG / 2})`} className="fill-muted-foreground">
            {yTitle}
          </text>
        )}
      </svg>
    </div>
  );
};

export default XYControl;
