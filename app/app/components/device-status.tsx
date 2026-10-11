"use client";

import { useEffect, useState } from "react";
import { detectDevice, type DeviceInfo } from "../lib/infer";

export default function DeviceStatus() {
  const [device, setDevice] = useState<DeviceInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    detectDevice().then((info) => {
      if (!cancelled) setDevice(info);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = device ? device.label : "detecting device…";
  const tone = device?.tier === "webgpu" ? "text-accent" : "text-muted";

  return (
    <div className="flex gap-4">
      <dt className="w-20 shrink-0 text-muted">device</dt>
      <dd className={`min-w-0 truncate ${tone}`}>{value}</dd>
    </div>
  );
}
