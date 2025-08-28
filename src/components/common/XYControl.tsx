'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';

export interface XYControlProps {
  /** Initial value (default: {x: 0.5, y: 0.5}) - used only when value prop is not provided */
  initialValue?: { x: number; y: number };
  /** Controlled value - when provided, component becomes controlled */
  value?: { x: number; y: number };
  /** Callback fired when values change */
  onChange?: (value: { x: number; y: number }) => void;
  /** Custom class name */
  className?: string;
  /** Whether the control is disabled */
  disabled?: boolean;
  /** Grid lines count (default: 4) */
  gridLines?: number;
  /** Point color (default: '#3b82f6') */
  pointColor?: string;
  /** Grid color (default: '#e5e7eb') */
  gridColor?: string;
  /** Background color (default: '#f9fafb') */
  backgroundColor?: string;
  /** Title for X axis (displayed at bottom) */
  xTitle?: string;
  /** Title for Y axis (displayed on left side) */
  yTitle?: string;
}

const XYControl: React.FC<XYControlProps> = ({
  initialValue = { x: 0.5, y: 0.5 },
  value,
  onChange,
  className = '',
  disabled = false,
  gridLines = 4,
  pointColor = 'hsl(var(--primary))',
  gridColor = 'hsl(var(--foreground))',
  backgroundColor = 'hsl(var(--muted))',
  xTitle,
  yTitle,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const isControlled = value !== undefined;
  
  const [isDragging, setIsDragging] = useState(false);
  const [displayPosition, setDisplayPosition] = useState(value ?? initialValue);

  const isDraggingRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const rectRef = useRef<DOMRect | null>(null);

  // Sync with external value, but only when not dragging.
  useEffect(() => {
    if (isControlled && !isDragging) {
      setDisplayPosition(value);
    }
  }, [value, isControlled, isDragging]);
  
  const getPosFromClient = (clientX: number, clientY: number) => {
    const r = rectRef.current;
    if (!r) return { x: 0.5, y: 0.5 }; // Fallback, should not happen in practice
    const x = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    const y = Math.max(0, Math.min(1, 1 - (clientY - r.top) / r.height));
    return { x, y };
  };

  const onPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (disabled || !svgRef.current) return;
    e.preventDefault();

    // cache rect once; avoids jitter during store-triggered rerenders
    rectRef.current = svgRef.current.getBoundingClientRect();

    // capture pointer so we keep move/up even if DOM rerenders
    svgRef.current.setPointerCapture(e.pointerId);
    activePointerIdRef.current = e.pointerId;

    isDraggingRef.current = true;
    setIsDragging(true);

    const p = getPosFromClient(e.clientX, e.clientY);
    setDisplayPosition(p);
    onChange?.(p);
  }, [disabled, onChange]); // ✅ stable during drag

  const onPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDraggingRef.current || e.pointerId !== activePointerIdRef.current) return;
    const p = getPosFromClient(e.clientX, e.clientY);
    setDisplayPosition(p);
    onChange?.(p);
  }, [onChange]);

  const endDrag = useCallback((e?: React.PointerEvent<SVGSVGElement>) => {
    if (!isDraggingRef.current) return;
    try {
      if (e && svgRef.current && typeof e.pointerId === 'number') {
        svgRef.current.releasePointerCapture(e.pointerId);
      }
    } catch {}
    isDraggingRef.current = false;
    activePointerIdRef.current = null;
    rectRef.current = null;
    setIsDragging(false);
  }, []);
  
  const SVG_SIZE = 300;
  const normalizedToSVG = (x: number, y: number) => ({ x: x * SVG_SIZE, y: (1 - y) * SVG_SIZE });
  const svgPosition = normalizedToSVG(displayPosition.x, displayPosition.y);

  const generateGridLines = () => {
    const lines = [];
    const step = 1 / (gridLines + 1);
    for (let i = 1; i <= gridLines; i++) {
        const pos = i * step * SVG_SIZE;
        lines.push(<line key={`v-${i}`} x1={pos} y1={0} x2={pos} y2={SVG_SIZE} className="stroke-foreground" strokeWidth="1" opacity="0.2" />);
        lines.push(<line key={`h-${i}`} x1={0} y1={pos} x2={SVG_SIZE} y2={pos} className="stroke-foreground" strokeWidth="1" opacity="0.2" />);
    }
    return lines;
  };

  return (
    <div className={`w-full h-full min-h-[200px] ${className}`}>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        preserveAspectRatio="xMidYMid meet"
        className={`border border-border rounded-lg cursor-${disabled ? 'not-allowed' : 'crosshair'} select-none touch-none`}
        style={{ backgroundColor, aspectRatio: '1', maxWidth: '100%', maxHeight: '100%' }}
        onPointerDownCapture={onPointerDown}
        onPointerMoveCapture={onPointerMove}
        onPointerUpCapture={endDrag}
        onPointerCancelCapture={endDrag}
        onLostPointerCapture={endDrag}
      >
        <rect width={SVG_SIZE} height={SVG_SIZE} className="fill-muted" />
        {generateGridLines()}
        <rect width={SVG_SIZE} height={SVG_SIZE} fill="none" className="stroke-foreground" strokeWidth="1" opacity="0.2" />
        <line x1={SVG_SIZE/2} y1={0} x2={SVG_SIZE/2} y2={SVG_SIZE} className="stroke-foreground" strokeWidth="1" opacity="0.4" />
        <line x1={0} y1={SVG_SIZE/2} x2={SVG_SIZE} y2={SVG_SIZE/2} className="stroke-foreground" strokeWidth="1" opacity="0.4" />
        <circle
          cx={svgPosition.x}
          cy={svgPosition.y}
          r="10"
          className={`${disabled ? 'opacity-50' : ''} fill-primary stroke-background`}
          strokeWidth="3"
          style={{ transition: 'transform 0.05s ease-out', transform: isDragging ? 'scale(1.1)' : 'scale(1)' }}
        />
        <text x={10} y={SVG_SIZE - 10} className="pointer-events-none select-none fill-muted-foreground" fontSize="11" fontFamily="monospace">
          X: {displayPosition.x.toFixed(3)}, Y: {displayPosition.y.toFixed(3)}
        </text>
        {xTitle && (
          <text x={SVG_SIZE / 2} y={SVG_SIZE - 25} className="pointer-events-none select-none fill-muted-foreground" fontSize="14" fontWeight="500" textAnchor="middle">
            {xTitle}
          </text>
        )}
        {yTitle && (
          <text x={20} y={SVG_SIZE / 2} fontSize="14" fontWeight="500" textAnchor="middle" transform={`rotate(-90, 20, ${SVG_SIZE / 2})`} className="pointer-events-none select-none fill-muted-foreground">
            {yTitle}
          </text>
        )}
      </svg>
    </div>
  );
};

export default XYControl;