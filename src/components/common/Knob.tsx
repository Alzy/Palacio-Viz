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
  color = 'hsl(var(--primary))',
  trackColor = 'hsl(var(--muted))',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, value: 0 });
  const knobRef = useRef<HTMLDivElement>(null);

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

  // Handle mouse down
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (disabled) return;
    
    event.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: event.clientX,
      y: event.clientY,
      value: value,
    });
  }, [disabled, value]);

  // Handle mouse move (global)
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging || disabled) return;
    
    const deltaX = event.clientX - dragStart.x;
    const deltaY = dragStart.y - event.clientY; // Invert Y axis
    
    // Combine X and Y movement for more intuitive control
    const combinedDelta = (deltaX + deltaY) * 0.005;
    const newValue = clampValue(dragStart.value + combinedDelta * (max - min));
    
    onChange(newValue);
  }, [isDragging, disabled, dragStart, onChange, clampValue, min, max]);

  // Handle mouse up (global)
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle touch events
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (disabled) return;
    
    event.preventDefault();
    const touch = event.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX,
      y: touch.clientY,
      value: value,
    });
  }, [disabled, value]);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!isDragging || disabled) return;
    
    event.preventDefault();
    const touch = event.touches[0];
    const deltaX = touch.clientX - dragStart.x;
    const deltaY = dragStart.y - touch.clientY; // Invert Y axis
    
    const combinedDelta = (deltaX + deltaY) * 0.005;
    const newValue = clampValue(dragStart.value + combinedDelta * (max - min));
    
    onChange(newValue);
  }, [isDragging, disabled, dragStart, onChange, clampValue, min, max]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Global event listeners for drag operations
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const knobSize = size;
  const indicatorLength = knobSize * 0.35;
  const indicatorX = Math.cos((angle * Math.PI) / 180) * indicatorLength;
  const indicatorY = Math.sin((angle * Math.PI) / 180) * indicatorLength;

  return (
    <div className={`inline-flex flex-col items-center space-y-2 ${className}`}>
      {/* Knob */}
      <div
        ref={knobRef}
        className={`
          relative rounded-full border-2 select-none touch-none
          ${disabled 
            ? 'cursor-not-allowed opacity-50' 
            : 'cursor-pointer hover:shadow-lg'
          }
          ${isDragging ? 'shadow-lg scale-105' : ''}
          transition-all duration-150
        `}
        style={{
          width: knobSize,
          height: knobSize,
          backgroundColor: trackColor,
          borderColor: color,
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Track arc */}
        <svg
          className="absolute inset-0"
          width={knobSize}
          height={knobSize}
          style={{ transform: 'rotate(-135deg)' }}
        >
          <circle
            cx={knobSize / 2}
            cy={knobSize / 2}
            r={(knobSize - 8) / 2}
            fill="none"
            stroke={trackColor}
            strokeWidth="3"
            strokeDasharray={`${normalizedValue * 270 * ((knobSize - 8) * Math.PI / 180)} ${270 * ((knobSize - 8) * Math.PI / 180)}`}
            strokeLinecap="round"
            style={{
              stroke: color,
              opacity: 0.3,
            }}
          />
        </svg>

        {/* Center circle */}
        <div
          className="absolute rounded-full"
          style={{
            width: knobSize * 0.7,
            height: knobSize * 0.7,
            backgroundColor: color,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Indicator line */}
          <div
            className="absolute bg-white rounded-full"
            style={{
              width: 2,
              height: indicatorLength,
              top: '50%',
              left: '50%',
              transformOrigin: '50% 0%',
              transform: `translate(-50%, -50%) rotate(${angle + 90}deg)`,
            }}
          />
        </div>
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