"use client";

interface RadiusSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function RadiusSlider({ 
  value, 
  onChange, 
  min = 25, 
  max = 500, 
  step = 25 
}: RadiusSliderProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm glass-label">
        Search Radius: <span className="text-primary font-semibold">{value} km</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range-track slider"
        aria-label="Adjust search radius"
      />
      <div className="flex justify-between text-xs glass-text-subtle">
        <span>{min} km</span>
        <span>{max} km</span>
      </div>
    </div>
  );
}
