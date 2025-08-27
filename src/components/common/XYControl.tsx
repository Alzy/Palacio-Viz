'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';

export interface XYControlProps {
  /** Initial X value (0-1, default: 0.5) */
  initialX?: number;
  /** Initial Y value (0-1, default: 0.5) */
  initialY?: number;
  /** Callback fired when values change */
  onChange?: (x: number, y: number) => void;
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

export interface XYControlValue {
  x: number;
  y: number;
}

const XYControl: React.FC<XYControlProps> = ({
  initialX = 0.5,
  initialY = 0.5,
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [inputType, setInputType] = useState<'mouse' | 'touch' | null>(null);

  // Fixed dimensions for consistent coordinate mapping
  const SVG_SIZE = 300;

  // Convert screen coordinates to normalized values (0-1)
  const screenToNormalized = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0.5, y: 0.5 };

    const rect = svgRef.current.getBoundingClientRect();

    // Calculate relative position within the actual rendered SVG
    const relativeX = (clientX - rect.left) / rect.width;
    const relativeY = (clientY - rect.top) / rect.height;

    // Clamp to bounds and invert Y axis
    const x = Math.max(0, Math.min(1, relativeX));
    const y = Math.max(0, Math.min(1, 1 - relativeY)); // Invert Y axis

    return { x, y };
  }, []);

  // Convert normalized values to SVG coordinates
  const normalizedToSVG = useCallback((x: number, y: number) => {
    return {
      x: x * SVG_SIZE,
      y: (1 - y) * SVG_SIZE, // Invert Y axis for SVG
    };
  }, []);

  // Handle position updates
  const updatePosition = useCallback((newX: number, newY: number) => {
    const clampedX = Math.max(0, Math.min(1, newX));
    const clampedY = Math.max(0, Math.min(1, newY));

    setPosition({ x: clampedX, y: clampedY });
    onChange?.(clampedX, clampedY);
  }, [onChange]);

  // Mouse event handlers
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (disabled || inputType === 'touch') return; // Ignore if touch is active

    event.preventDefault();
    setInputType('mouse');
    setIsDragging(true);

    const { x, y } = screenToNormalized(event.clientX, event.clientY);
    updatePosition(x, y);
  }, [disabled, inputType, screenToNormalized, updatePosition]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging || disabled || inputType !== 'mouse') return;

    event.preventDefault();
    const { x, y } = screenToNormalized(event.clientX, event.clientY);
    updatePosition(x, y);
  }, [isDragging, disabled, inputType, screenToNormalized, updatePosition]);

  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (!isDragging || inputType !== 'mouse') return;

    event.preventDefault();
    setIsDragging(false);
    // Reset input type after a delay to allow for any remaining mouse events
    setTimeout(() => setInputType(null), 100);
  }, [isDragging, inputType]);

  // Touch event handlers
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (disabled) return;

    event.preventDefault();
    setInputType('touch');
    setIsDragging(true);

    const touch = event.touches[0];
    const { x, y } = screenToNormalized(touch.clientX, touch.clientY);
    updatePosition(x, y);
  }, [disabled, screenToNormalized, updatePosition]);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!isDragging || disabled || inputType !== 'touch') return;

    event.preventDefault();
    const touch = event.touches[0];
    const { x, y } = screenToNormalized(touch.clientX, touch.clientY);
    updatePosition(x, y);
  }, [isDragging, disabled, inputType, screenToNormalized, updatePosition]);

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (!isDragging || inputType !== 'touch') return;

    event.preventDefault();
    setIsDragging(false);
    // Reset input type after a delay to prevent ghost mouse events
    setTimeout(() => setInputType(null), 300);
  }, [isDragging, inputType]);

  // Global event listeners for drag operations
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { passive: false });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd, { passive: false });

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Generate grid lines
  const generateGridLines = () => {
    const lines = [];
    const step = 1 / (gridLines + 1);

    for (let i = 1; i <= gridLines; i++) {
      const pos = i * step;

      // Vertical lines
      lines.push(
        <line
          key={`v-${i}`}
          x1={pos * SVG_SIZE}
          y1={0}
          x2={pos * SVG_SIZE}
          y2={SVG_SIZE}
          className="stroke-foreground"
          strokeWidth="1"
          opacity="0.2"
        />
      );

      // Horizontal lines
      lines.push(
        <line
          key={`h-${i}`}
          x1={0}
          y1={pos * SVG_SIZE}
          x2={SVG_SIZE}
          y2={pos * SVG_SIZE}
          className="stroke-foreground"
          strokeWidth="1"
          opacity="0.2"
        />
      );
    }

    return lines;
  };

  const svgPosition = normalizedToSVG(position.x, position.y);

  return (
    <div ref={containerRef} className={`w-full h-full min-h-[200px] ${className}`}>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        preserveAspectRatio="xMidYMid meet"
        className={`border border-border rounded-lg cursor-${disabled ? 'not-allowed' : 'crosshair'} select-none touch-none`}
        style={{
          backgroundColor,
          aspectRatio: '1',
          maxWidth: '100%',
          maxHeight: '100%',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Background */}
        <rect
          width={SVG_SIZE}
          height={SVG_SIZE}
          className="fill-muted"
        />

        {/* Grid lines */}
        {generateGridLines()}

        {/* Border */}
        <rect
          width={SVG_SIZE}
          height={SVG_SIZE}
          fill="none"
          className="stroke-foreground"
          strokeWidth="1"
          opacity="0.2"
        />

        {/* Center axis lines */}
        <line
          x1={SVG_SIZE / 2}
          y1={0}
          x2={SVG_SIZE / 2}
          y2={SVG_SIZE}
          className="stroke-foreground"
          strokeWidth="1"
          opacity="0.4"
        />
        <line
          x1={0}
          y1={SVG_SIZE / 2}
          x2={SVG_SIZE}
          y2={SVG_SIZE / 2}
          className="stroke-foreground"
          strokeWidth="1"
          opacity="0.4"
        />

        {/* Control point */}
        <circle
          cx={svgPosition.x}
          cy={svgPosition.y}
          r="10"
          className={`${disabled ? 'opacity-50' : ''} transition-transform duration-150 fill-primary stroke-background`}
          strokeWidth="3"
          style={{
            filter: isDragging
              ? 'drop-shadow(0 6px 12px rgba(0,0,0,0.3))'
              : 'drop-shadow(0 3px 6px rgba(0,0,0,0.15))',
          }}
        />

        {/* Value display */}
        <text
          x={10}
          y={SVG_SIZE - 10}
          className="pointer-events-none select-none fill-muted-foreground"
          fontSize="11"
          fontFamily="monospace"
        >
          X: {position.x.toFixed(3)}, Y: {position.y.toFixed(3)}
        </text>

        {/* X-axis title */}
        {xTitle && (
          <text
            x={SVG_SIZE / 2}
            y={SVG_SIZE - 25}
            className="pointer-events-none select-none fill-muted-foreground"
            fontSize="14"
            fontWeight="500"
            textAnchor="middle"
          >
            {xTitle}
          </text>
        )}

        {/* Y-axis title */}
        {yTitle && (
          <text
            x={20}
            y={SVG_SIZE / 2}
            fontSize="14"
            fontWeight="500"
            textAnchor="middle"
            transform={`rotate(-90, 20, ${SVG_SIZE / 2})`}
            className="pointer-events-none select-none fill-muted-foreground"
          >
            {yTitle}
          </text>
        )}
      </svg>
    </div>
  );
};

export default XYControl;