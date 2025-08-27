'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

export interface DebouncedTextInputProps {
  /** Current value of the input */
  value: string;
  /** Callback fired when the debounced value changes */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
  /** Debounce delay in milliseconds (default: 500) */
  debounceMs?: number;
  /** Whether to use textarea instead of input (default: false) */
  multiline?: boolean;
  /** Number of rows for textarea (default: 4) */
  rows?: number;
  /** Additional props to pass to the input/textarea */
  inputProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement> & React.InputHTMLAttributes<HTMLInputElement>;
}

const DebouncedTextInput: React.FC<DebouncedTextInputProps> = ({
  value,
  onChange,
  placeholder = '',
  disabled = false,
  className = '',
  debounceMs = 500,
  multiline = false,
  rows = 4,
  inputProps = {},
}) => {
  const [internalValue, setInternalValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with external value changes (e.g., from history selection)
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Debounced onChange handler
  const debouncedOnChange = useCallback((newValue: string) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, debounceMs);
  }, [onChange, debounceMs]);

  // Handle input changes
  const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const newValue = event.target.value;
    setInternalValue(newValue);
    debouncedOnChange(newValue);
  }, [debouncedOnChange]);

  // Handle key press for Enter submission (single-line mode only)
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (!multiline && event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      
      // Clear any pending debounced call
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Immediately trigger onChange (bypass debounce)
      onChange(internalValue);
    }
  }, [multiline, internalValue, onChange]);

  // Prevent newlines in single-line mode by filtering them out
  const handleInput = useCallback((event: React.FormEvent<HTMLTextAreaElement>) => {
    if (!multiline) {
      const target = event.target as HTMLTextAreaElement;
      const value = target.value;
      
      // Remove any newline characters
      const cleanValue = value.replace(/\n/g, '');
      
      if (cleanValue !== value) {
        target.value = cleanValue;
        setInternalValue(cleanValue);
        debouncedOnChange(cleanValue);
      }
    }
  }, [multiline, debouncedOnChange]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Default styling
  const defaultClassName = `
    w-full px-3 py-2 border border-border rounded-lg resize-none
    focus:ring-2 focus:ring-ring focus:border-ring
    disabled:bg-muted disabled:cursor-not-allowed
    transition-colors duration-200
    bg-input text-foreground
  `;

  const combinedClassName = `${defaultClassName} ${className}`.trim();

  // Always use textarea for text wrapping, but control behavior based on multiline prop
  return (
    <textarea
      {...(inputProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
      value={internalValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onInput={handleInput}
      placeholder={placeholder}
      disabled={disabled}
      rows={multiline ? rows : 1}
      className={combinedClassName}
      style={{
        resize: multiline ? 'vertical' : 'none',
        overflow: 'hidden',
        ...inputProps.style,
      }}
    />
  );
};

export default DebouncedTextInput;