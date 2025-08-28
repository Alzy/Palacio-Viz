'use client';

import React from 'react';
import { KnobHeadless } from './ReactKnobHeadless';

type KnobHeadlessProps = React.ComponentProps<typeof KnobHeadless>;
type KnobProps = Pick<KnobHeadlessProps, 'valueRaw' | 'onValueRawChange' | 'valueMin' | 'valueMax'> & {
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
};

export function Knob(props: KnobProps) {
  const {
    valueRaw,
    valueMin = 0,
    valueMax = 1,
    size = 60,
    disabled = false,
    className = '',
    label,
    showValue = true,
    valueDecimals = 2,
    onValueRawChange,
    ...knobProps
  } = props;

  // Simple rounding and display functions
  const valueRawRoundFn = (valueRaw: number): number => {
    return Math.round(valueRaw * 100) / 100;
  };
  const valueRawDisplayFn = (valueRaw: number): string => {
    return valueRaw.toFixed(valueDecimals);
  };

  // Normalize value to 0-1 range for visual display
  const normalizedValue = (valueRaw - valueMin) / (valueMax - valueMin);
  const angle = -135 + (normalizedValue * 270);

  const center = size / 2;
  const strokeWidth = size / 10;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (circumference * 270) / 360;
  const arcOffset = normalizedValue * arcLength;
  const rotation = angle + 2;

  return (
    <div className={`inline-flex flex-col items-center space-y-2 ${className}`}>
      <KnobHeadless
        valueRaw={valueRaw}
        valueMin={valueMin}
        valueMax={valueMax}
        valueRawRoundFn={valueRawRoundFn}
        valueRawDisplayFn={valueRawDisplayFn}
        onValueRawChange={onValueRawChange}
        dragSensitivity={0.006}
        aria-label={label || 'Knob control'}
        includeIntoTabOrder={false}
        style={{
          width: size,
          height: size,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
        className="select-none"
        {...knobProps}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transition-transform duration-150 hover:scale-105"
          style={{ pointerEvents: 'none' }}
        >
          <defs>
            <filter id={`knob-shadow-${size}`} x="-50%" y="-50%" width="200%" height="200%">
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
          <g transform={`rotate(${rotation} ${center} ${center})`} filter={`url(#knob-shadow-${size})`}>
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
      </KnobHeadless>

      {/* Label and Value */}
      {(label || showValue) && (
        <div className="text-center">
          {label && (
            <div className="text-sm font-medium text-foreground">{label}</div>
          )}
          {showValue && (
            <div className="text-xs text-muted-foreground">
              {valueRaw.toFixed(valueDecimals)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Knob;