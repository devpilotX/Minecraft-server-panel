"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/Badge";
import { Cpu, MemoryStick, HardDrive, Wifi, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface DataPoint {
  time: string;
  value: number;
}

const MAX_POINTS = 60; // 60 data points = 1 minute at 1s interval
const CHART_HEIGHT = 120;
const CHART_WIDTH = 600;

function MiniChart({ data, color, maxVal, unit }: {
  data: DataPoint[]; color: string; maxVal: number; unit: string;
}) {
  if (data.length < 2) {
    return <div className="h-[120px] flex items-center justify-center text-xs text-text-tertiary">Collecting data...</div>;
  }

  const points = data.map((d, i) => {
    const x = (i / (MAX_POINTS - 1)) * CHART_WIDTH;
    const y = CHART_HEIGHT - (d.value / (maxVal || 1)) * CHART_HEIGHT;
    return `${x},${y}`;
  }).join(" ");

  const areaPoints = `0,${CHART_HEIGHT} ${points} ${CHART_WIDTH},${CHART_HEIGHT}`;
  const current = data[data.length - 1]?.value ?? 0;
  const prev = data.length > 1 ? data[data.length - 2]?.value ?? 0 : current;
  const trend = current > prev ? "up" : current < prev ? "down" : "flat";

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full h-[120px]" preserveAspectRatio="none">
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((p) => (
          <line key={p} x1="0" y1={CHART_HEIGHT * p} x2={CHART_WIDTH} y2={CHART_HEIGHT * p}
            stroke="currentColor" strokeWidth="0.5" className="text-border-subtle" strokeDasharray="4 4" />
        ))}
        {/* Area fill */}
        <polygon points={areaPoints} fill={color} fillOpacity="0.1" />
        {/* Line */}
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Current dot */}
        {data.length > 0 && (
          <circle cx={((data.length - 1) / (MAX_POINTS - 1)) * CHART_WIDTH}
            cy={CHART_HEIGHT - (current / (maxVal || 1)) * CHART_HEIGHT}
            r="3" fill={color} />
        )}
      </svg>
      {/* Current value overlay */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        <span className="text-lg font-bold" style= color >{current.toFixed(1)}</span>
        <span className="text-xs text-text-tertiary">{unit}</span>
        {trend === "up" && <TrendingUp className="h-3 w-3 text-accent-red" />}
        {trend === "down" && <TrendingDown className="h-3 w-3 text-accent-green" />}
        {trend === "flat" && <Minus className="h-3 w-3 text-text-tertiary" />}
      </div>
    </div>
  );
}

export default function MonitoringPage() {
  const resources = useAppStore((s) => s.server.resources);
  const serverStatus = useAppStore((s) => s.server.serverStatus);

  const [cpuHistory, setCpuHistory] = useState<DataPoint[]>([]);
  const [memHistory, setMemHistory] = useState<DataPoint[]>([]);
  const [diskHistory, setDiskHistory] = useState<DataPoint[]>([]);
  const [netRxHistory, setNetRxHistory] = useState<DataPoint[]>([]);
  const [netTxHistory, setNetTxHistory] = useState<DataPoint[]>([]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const pushPoint = useCallback(() => {
    const now = new Date().toLocaleTimeString();

    setCpuHistory((prev) => {
      const next = [...prev, { time: now, value: resources?.cpuPercent ?? 0 }];
      return next.slice(-MAX_POINTS);
    });
    setMemHistory((prev) => {
      const next = [...prev, { time: now, value: (resources?.memoryBytes ?? 0) / 1024 / 1024 }];
      return next.slice(-MAX_POINTS);
    });
    setDiskHistory((prev) => {
      const next = [...prev, { time: now, value: (resources?.diskBytes ?? 0) / 1024 / 1024 }];
      return next.slice(-MAX_POINTS);
    });
    setNetRxHistory((prev) => {
      const next = [...prev, { time: now, value: (resources?.networkRxBytes ?? 0) / 1024 }];
      return next.slice(-MAX_POINTS);
    });
    setNetTxHistory((prev) => {
      const next = [...prev, { time: now, value: (resources?.networkTxBytes ?? 0) / 1024 }];
      return next.slice(-MAX_POINTS);
    });
  }, [resources]);

  useEffect(() => {
    pushPoint();
    intervalRef.current = setInterval(pushPoint, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pushPoint]);

  const memLimitMb = (resources?.memoryLimitBytes ?? 1) / 1024 / 1024;
  const diskLimitMb = (resources?.diskLimitBytes ?? 1) / 1024 / 1024;

  const charts = [
    {
      title: "CPU Usage",
      icon: <Cpu className="h-5 w-5" />,
      data: cpuHistory,
      color: "#6366f1",
      maxVal: 100,
      unit: "%",
      iconBg: "bg-accent-purple/10 text-accent-purple",
    },
    {
      title: "Memory",
      icon: <MemoryStick className="h-5 w-5" />,
      data: memHistory,
      color: "#3b82f6",
      maxVal: memLimitMb,
      unit: "MB",
      iconBg: "bg-accent-blue/10 text-accent-blue",
    },
    {
      title: "Disk",
      icon: <HardDrive className="h-5 w-5" />,
      data: diskHistory,
      color: "#f59e0b",
      maxVal: diskLimitMb,
      unit: "MB",
      iconBg: "bg-accent-orange/10 text-accent-orange",
    },
    {
      title: "Network RX",
      icon: <Wifi className="h-5 w-5" />,
      data: netRxHistory,
      color: "#10b981",
      maxVal: Math.max(...netRxHistory.map((d) => d.value), 100),
      unit: "KB",
      iconBg: "bg-accent-green/10 text-accent-green",
    },
    {
      title: "Network TX",
      icon: <Wifi className="h-5 w-5" />,
      data: netTxHistory,
      color: "#ef4444",
      maxVal: Math.max(...netTxHistory.map((d) => d.value), 100),
      unit: "KB",
      iconBg: "bg-accent-red/10 text-accent-red",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Monitoring</h1>
          <p className="text-sm text-text-tertiary mt-1">Real-time server resource usage</p>
        </div>
        <Badge variant={serverStatus === "online" ? "success" : serverStatus === "starting" ? "warning" : "danger"}>
          {serverStatus?.toUpperCase() ?? "UNKNOWN"}
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {charts.map((chart) => (
          <div key={chart.title} className="dpx-card overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-border-subtle">
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", chart.iconBg)}>
                {chart.icon}
              </div>
              <span className="text-sm font-semibold text-text-primary">{chart.title}</span>
            </div>
            <div className="px-5 py-3">
              <MiniChart data={chart.data} color={chart.color} maxVal={chart.maxVal} unit={chart.unit} />
            </div>
          </div>
        ))}
      </div>

      {/* Quick stats */}
      <div className="dpx-card p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Current Values</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "CPU", value: `${(resources?.cpuPercent ?? 0).toFixed(1)}%` },
            { label: "Memory", value: `${((resources?.memoryBytes ?? 0) / 1024 / 1024).toFixed(0)} MB` },
            { label: "Disk", value: `${((resources?.diskBytes ?? 0) / 1024 / 1024).toFixed(0)} MB` },
            { label: "Net RX", value: `${((resources?.networkRxBytes ?? 0) / 1024).toFixed(1)} KB` },
            { label: "Net TX", value: `${((resources?.networkTxBytes ?? 0) / 1024).toFixed(1)} KB` },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <span className="text-[10px] text-text-tertiary uppercase tracking-wider">{s.label}</span>
              <p className="text-lg font-bold text-text-primary mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}