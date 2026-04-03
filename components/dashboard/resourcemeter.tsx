"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils/cn";

export interface ResourceMeterProps {
  label: string;
  value: number;
  current: string;
  max: string;
  icon: React.ReactNode;
  color: "blue" | "purple" | "green" | "orange" | "red";
  size?: "sm" | "md" | "lg";
}

const COLOR_MAP = {
  blue: {
    stroke: "stroke-accent-blue",
    bg: "bg-accent-blue/10",
    text: "text-accent-blue",
    trackStroke: "stroke-accent-blue/15",
  },
  purple: {
    stroke: "stroke-accent-purple",
    bg: "bg-accent-purple/10",
    text: "text-accent-purple",
    trackStroke: "stroke-accent-purple/15",
  },
  green: {
    stroke: "stroke-accent-green",
    bg: "bg-accent-green/10",
    text: "text-accent-green",
    trackStroke: "stroke-accent-green/15",
  },
  orange: {
    stroke: "stroke-accent-orange",
    bg: "bg-accent-orange/10",
    text: "text-accent-orange",
    trackStroke: "stroke-accent-orange/15",
  },
  red: {
    stroke: "stroke-accent-red",
    bg: "bg-accent-red/10",
    text: "text-accent-red",
    trackStroke: "stroke-accent-red/15",
  },
} as const;

const SIZE_MAP = {
  sm: { svgSize: 80, strokeWidth: 6, radius: 34, fontSize: "text-lg" },
  md: { svgSize: 100, strokeWidth: 7, radius: 42, fontSize: "text-xl" },
  lg: { svgSize: 120, strokeWidth: 8, radius: 50, fontSize: "text-2xl" },
} as const;

export function ResourceMeter({
  label,
  value,
  current,
  max,
  icon,
  color,
  size = "md",
}: ResourceMeterProps) {
  const colors = COLOR_MAP[color];
  const dims = SIZE_MAP[size];
  const clampedValue = Math.min(100, Math.max(0, value));

  const dynamicColor = useMemo(() => {
    if (clampedValue >= 90) return COLOR_MAP.red;
    if (clampedValue >= 75) return COLOR_MAP.orange;
    return colors;
  }, [clampedValue, colors]);

  const circumference = 2 * Math.PI * dims.radius;
  const dashOffset = circumference - (clampedValue / 100) * circumference;

  return (
    <div className="dpx-card p-4 flex flex-col items-center gap-3">
      {/* Circular gauge */}
      <div className="relative" style= width: dims.svgSize, height: dims.svgSize >
        <svg
          width={dims.svgSize}
          height={dims.svgSize}
          viewBox={`0 0 ${dims.svgSize} ${dims.svgSize}`}
          className="transform -rotate-90"
        >
          {/* Track */}
          <circle
            cx={dims.svgSize / 2}
            cy={dims.svgSize / 2}
            r={dims.radius}
            fill="none"
            strokeWidth={dims.strokeWidth}
            className={dynamicColor.trackStroke}
          />
          {/* Progress */}
          <circle
            cx={dims.svgSize / 2}
            cy={dims.svgSize / 2}
            r={dims.radius}
            fill="none"
            strokeWidth={dims.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className={cn(dynamicColor.stroke, "transition-all duration-700 ease-out")}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(dims.fontSize, "font-bold", dynamicColor.text)}>
            {Math.round(clampedValue)}%
          </span>
        </div>
      </div>

      {/* Label + icon */}
      <div className="flex items-center gap-1.5 text-text-secondary text-sm">
        <span className={dynamicColor.text}>{icon}</span>
        <span>{label}</span>
      </div>

      {/* Current / Max */}
      <p className="text-xs text-text-tertiary">
        {current} / {max}
      </p>
    </div>
  );
}