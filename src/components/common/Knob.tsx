'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

export interface KnobProps {
  /** Current value (0-1) */
  value: number;
  /** Callback fired when value changes */
  onChange: (value: number) => void;
  /** Minimum value (default: 0) */
  min?: number;
  /** Maximum value (default: 1) */
  max?: number;
  /** Step size for discrete values (default: 0.01) */
  step?: number;
  /** Size of the knob in pixels (default: 60) */
  size?: number;
  /** Whether the knob is disabled */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
  /** Label to display below the knob */
  label?: string;
  /** Whether to show the current value */
  showValue?: boolean;
  /** Number of decimal places to show in value (default: 2) */
  valueDecimals?: number;
  /** Color of the knob (default: '#3b82f6') */
  color?: string;
  /** Background color of the track (default: '#e5e7eb') */
  trackColor?: string;
}

const Knob: React.FC<KnobProps> = ({
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  size = 60,
  disabled = false,
  className = '',
  label,
  showValue = true,
  valueDecimals = 2,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const knobRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const dragStartRef = useRef({ y: 0, value: 0 });

  // Normalize value to 0-1 range
  const normalizedValue = (value - min) / (max - min);
  
  // Convert normalized value to angle (270 degrees range, starting from -135°)
  const angle = -135 + (normalizedValue * 270);

  // Clamp value to min/max and apply step
  const clampValue = useCallback((val: number) => {
    const clamped = Math.max(min, Math.min(max, val));
    if (step > 0) {
      return Math.round(clamped / step) * step;
    }
    return clamped;
  }, [min, max, step]);

  // Handle scroll wheel
  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (disabled) return;
    
    event.preventDefault();
    const delta = -event.deltaY * 0.001; // Invert and scale
    const newValue = clampValue(value + delta * (max - min));
    onChange(newValue);
  }, [disabled, value, onChange, clampValue, min, max]);

  // Handle mouse down for drag start
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (disabled) return;
    
    event.preventDefault();
    setIsDragging(true);
    isDraggingRef.current = true;
    
    dragStartRef.current = {
      y: event.clientY,
      value: value,
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      
      const { y: startY, value: startValue } = dragStartRef.current;
      const deltaY = startY - e.clientY;
      const sensitivity = 0.005;
      const change = deltaY * sensitivity * (max - min);
      const newValue = clampValue(startValue + change);
      onChange(newValue);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [disabled, value, onChange, clampValue, min, max]);

  // Handle touch events
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (disabled) return;
    
    event.preventDefault();
    const touch = event.touches[0];
    setIsDragging(true);
    isDraggingRef.current = true;
    
    dragStartRef.current = {
      y: touch.clientY,
      value: value,
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      const { y: startY, value: startValue } = dragStartRef.current;
      const deltaY = startY - touch.clientY;
      const sensitivity = 0.005;
      const change = deltaY * sensitivity * (max - min);
      const newValue = clampValue(startValue + change);
      onChange(newValue);
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  }, [disabled, value, onChange, clampValue, min, max]);

  const center = size / 2;
  const strokeWidth = size / 10;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  
  // -135 to 135 degrees is a 270 degree sweep
  const arcLength = (circumference * 270) / 360;
  const arcOffset = normalizedValue * arcLength;
  
  const rotation = angle + 2; // Add a 2-degree offset

  return (
    <div className={`inline-flex flex-col items-center space-y-2 ${className}`}>
      <div
        ref={knobRef}
        className={`
          select-none touch-none
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        `}
        style={{ width: size, height: size }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className={`
           transition-transform duration-150
           ${isDragging ? 'scale-105' : ''}
          `}
        >
          <defs>
            <filter id="knob-shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="hsl(var(--foreground))" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Background Track */}
          <g transform={`rotate(135 ${center} ${center})`}>
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={`${arcLength} ${circumference}`}
              className="stroke-muted"
            />
          </g>
          
          {/* Value Arc */}
          <g transform={`rotate(135 ${center} ${center})`}>
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={`${arcOffset} ${circumference}`}
              strokeLinecap="round"
              className="stroke-primary"
              style={{ transition: 'stroke-dasharray 0.1s linear' }}
            />
          </g>

          {/* Indicator Line */}
          <g transform={`rotate(${rotation} ${center} ${center})`} filter="url(#knob-shadow)">
            <line
              x1={center}
              y1={strokeWidth / 2}
              x2={center}
              y2={strokeWidth * 1.5}
              strokeWidth={strokeWidth / 1.5}
              strokeLinecap="round"
              className="stroke-foreground"
            />
          </g>
        </svg>
      </div>

      {/* Label and Value */}
      {(label || showValue) && (
        <div className="text-center">
          {label && (
            <div className="text-sm font-medium text-foreground">{label}</div>
          )}
          {showValue && (
            <div className="text-xs text-muted-foreground">
              {value.toFixed(valueDecimals)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Knob;