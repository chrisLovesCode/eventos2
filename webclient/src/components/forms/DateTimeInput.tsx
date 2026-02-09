'use client';

interface DateTimeInputProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  max?: string;
  error?: string;
  hint?: string;
}

export function DateTimeInput({
  id,
  name,
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  min,
  max,
  error,
  hint,
}: DateTimeInputProps) {
  // Konvertiere ISO 8601 zu datetime-local Format (YYYY-MM-DDTHH:mm)
  const toLocalDateTime = (isoString: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      // Format to YYYY-MM-DDTHH:mm (without seconds and timezone)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  // Konvertiere datetime-local zu ISO 8601
  const toISOString = (localDateTime: string) => {
    if (!localDateTime) return '';
    try {
      const date = new Date(localDateTime);
      return date.toISOString();
    } catch {
      return '';
    }
  };

  const localValue = toLocalDateTime(value);

  const handleChange = (localDateTime: string) => {
    const isoValue = toISOString(localDateTime);
    onChange(isoValue);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-muted-foreground">
        {label}
        {required && <span className="text-danger ml-1">*</span>}
      </label>
      <input
        type="datetime-local"
        id={id}
        name={name}
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        required={required}
        disabled={disabled}
        min={min ? toLocalDateTime(min) : undefined}
        max={max ? toLocalDateTime(max) : undefined}
        className={`form-input ${error ? 'border-danger' : ''}`}
      />
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}
    </div>
  );
}
