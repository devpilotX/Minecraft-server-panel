"use client";

import { cn } from "@/lib/utils";

interface ResourceMeterProps {
  label: string;
  value: number;
  max: number;
  unit?: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { svgSize: 80, strokeWidth: 6, radius: 34, fontSize: "text-sm" },
  md: { svgSize: 120, strokeWidth: 8, radius: 50, fontSize: "text-lg" },
  lg: { svgSize: 160, strokeWidth: 10, radius: 66, fontSize: "text-xl" },
};

const colorMap: Record<string, string> = {
  emerald: "stroke-emerald-500",
  blue: "stroke-blue-500",
  purple: "stroke-purple-500",
  amber: "stroke-amber-500",
  red: "stroke-red-500",
  cyan: "stroke-cyan-500",
};

function getAutoColor(percent: number): string {
  if (percent >= 90) return "stroke-red-500";
  if (percent >= 70) return "stroke-amber-500";
  return "stroke-emerald-500";
}

export function ResourceMeter({ label, value, max, unit = "%", color, size = "md", className }: ResourceMeterProps) {
  const dims = sizeMap[size];
  const circumference = 2 * Math.PI * dims.radius;
  const percent = max > 0 ? (value / max) * 100 : 0;
  const clampedValue = Math.min(Math.max(percent, 0), 100);
  const dashOffset = circumference - (clampedValue / 100) * circumference;
  const strokeColor = color ? (colorMap[color] || "stroke-emerald-500") : getAutoColor(clampedValue);

  const svgStyle = { width: dims.svgSize, height: dims.svgSize };
  const animStyle = { transition: "stroke-dashoffset 0.6s ease" };

  return (
    <div className={cn("dpx-card p-4 flex flex-col items-center gap-3", className)}>
      <div className="relative" style={svgStyle}>
        <svg width={dims.svgSize} height={dims.svgSize} viewBox={`0 0 ${dims.svgSize} ${dims.svgSize}`} className="transform -rotate-90">
          <circle cx={dims.svgSize / 2} cy={dims.svgSize / 2} r={dims.radius} fill="none" stroke="currentColor" className="text-white/10" strokeWidth={dims.strokeWidth} />
          <circle cx={dims.svgSize / 2} cy={dims.svgSize / 2} r={dims.radius} fill="none" className={strokeColor} strokeWidth={dims.strokeWidth} strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round" style={animStyle} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold text-white", dims.fontSize)}>
            {Math.round(clampedValue)}<span className="text-xs text-gray-400">{unit}</span>
          </span>
        </div>
      </div>
      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{label}</span>
    </div>
  );
}
