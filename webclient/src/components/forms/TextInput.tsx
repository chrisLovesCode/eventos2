'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { FieldCounter } from './FieldCounter';

interface TextInputProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'url';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  minLength?: number;
  maxLength?: number;
  error?: string;
  hint?: string;
}

export function TextInput({
  id,
  name,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  minLength,
  maxLength,
  error,
  hint,
}: TextInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === 'password';
  const inputType = isPasswordField && showPassword ? 'text' : type;

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-muted-foreground">
        {label}
        {required && <span className="text-danger ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          type={inputType}
          id={id}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          minLength={minLength}
          maxLength={maxLength}
          className={`form-input ${error ? 'border-danger' : ''} ${isPasswordField ? 'pr-10' : ''}`}
          autoComplete={isPasswordField ? 'current-password' : undefined}
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            disabled={disabled}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
            tabIndex={0}
          >
            <FontAwesomeIcon 
              icon={showPassword ? faEyeSlash : faEye} 
              className="w-5 h-5"
            />
          </button>
        )}
      </div>
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
