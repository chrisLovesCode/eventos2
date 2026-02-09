'use client';

import { FieldCounter } from './FieldCounter';

interface TextAreaProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  minLength?: number;
  maxLength?: number;
  rows?: number;
  error?: string;
  hint?: string;
}

export function TextArea({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  minLength,
  maxLength,
  rows = 4,
  error,
  hint,
}: TextAreaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-muted-foreground">
        {label}
        {required && <span className="text-danger ml-1">*</span>}
      </label>
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        minLength={minLength}
        maxLength={maxLength}
        rows={rows}
        className={`form-input resize-y ${error ? 'border-danger' : ''}`}
      />
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}
      {maxLength && (
        <FieldCounter currentLength={value.length} maxLength={maxLength} />
      )}
    </div>
  );
}
