"use client";

import { useEffect, useRef, useState } from "react";
import Panel from "./panel";
import { CheckIcon, UploadIcon } from "./icons";
import { detectDevice, removeBackground, type DeviceInfo } from "../lib/infer";

type Status = "idle" | "processing" | "done";
type View = "result" | "original";

const MODELS = [
  {
    id: "rmbg-1.4",
    label: "rmbg-1.4",
    detail: "bria · 88 mb · general purpose",
  },
  {
    id: "birefnet-lite",
    label: "birefnet-lite",
    detail: "mit · 99 mb · sharper edges",
  },
];

const MAX_BYTES = 32 * 1024 * 1024;

export default function UploadZone() {
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [model, setModel] = useState("rmbg-1.4");
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [view, setView] = useState<View>("result");
  const [status, setStatus] = useState<Status>("idle");
  const [phase, setPhase] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const startRef = useRef(start);

  useEffect(() => {
    startRef.current = start;
  });

  useEffect(() => {
    let cancelled = false;
    detectDevice().then((info) => {
      if (!cancelled) setDevice(info);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status !== "processing") return;
    const started = Date.now();
    const id = window.setInterval(
      () => setElapsed((Date.now() - started) / 1000),
      100,
    );
    return () => window.clearInterval(id);
  }, [status]);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith("image/"),
      );
      const pasted = item?.getAsFile();
      if (pasted) {
        e.preventDefault();
        startRef.current(pasted);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  async function start(next: File) {
    if (!next.type.startsWith("image/")) {
      setError("not an image");
      return;
    }
    if (next.size > MAX_BYTES) {
      setError("file is over 32 mb");
      return;
    }

    setError(null);
    setFile(next);
    setView("result");
    setElapsed(0);
    setPhase("starting");
    setStatus("processing");
    setOriginalUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(next);
    });
    setResultUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });

    try {
      const { blob } = await removeBackground(next, setPhase, model);
      setResultUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(blob);
      });
      setStatus("done");
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "inference failed, try a smaller image";
      setError(message);
      setStatus("idle");
    } finally {
      setPhase(null);
    }
  }

  function reset() {
    setOriginalUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    setResultUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    setFile(null);
    setError(null);
    setPhase(null);
    setStatus("idle");
  }

  function download() {
    if (!resultUrl || !file) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = file.name.replace(/\.[^.]+$/, "") + "-snip.png";
    a.click();
  }

  const active = MODELS.find((m) => m.id === model) ?? MODELS[0];
  const activeDetail = device ? device.label : "detecting device…";
  const shown =
    status === "done" && view === "result" && resultUrl ? resultUrl : originalUrl;

  return (
    <Panel label="input" className="p-3 sm:p-4">
      {status === "idle" ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const dropped = e.dataTransfer.files?.[0];
            if (dropped) start(dropped);
          }}
          className={`flex cursor-pointer flex-col items-center border border-dashed px-6 py-10 text-center transition-colors ${
            dragging
              ? "border-accent bg-foreground/5"
              : "border-line hover:bg-foreground/5"
          }`}
        >
          <span className="flex h-9 w-9 items-center justify-center border border-line text-muted">
            <UploadIcon className="h-4 w-4" />
          </span>
          <p className="mt-4 text-sm">drop an image here</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
            className="mt-4 border border-line px-3 py-1.5 text-[13px] transition-colors hover:bg-foreground hover:text-background"
          >
            browse files
          </button>
          <p className="mt-4 flex items-center gap-1.5 text-[12px] text-muted">
            or press
            <kbd className="border border-line px-1.5 py-px text-[11px]">
              ctrl
            </kbd>
            <kbd className="border border-line px-1.5 py-px text-[11px]">v</kbd>
            to paste
          </p>
          <p className="mt-3 text-[11px] tracking-tight text-muted">
            png · jpg · webp · avif · gif · bmp · max 32 mb
          </p>
          {error && (
            <p className="mt-3 max-w-full break-words text-[12px] text-red-500">
              error: {error}
            </p>
          )}
        </div>
      ) : (
        <div>
          <div className="checkerboard relative flex items-center justify-center overflow-hidden border border-line py-6">
            {shown && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shown}
                alt={file?.name ?? "image"}
                className="max-h-72 w-auto max-w-full object-contain"
              />
            )}
            {status === "processing" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/85">
                <p className="text-[13px] text-muted">
                  {phase ?? "running inference"} · {elapsed.toFixed(1)}s
                </p>
                <div className="h-px w-40 overflow-hidden bg-line">
                  <div className="animate-indeterminate h-full w-1/4 bg-foreground" />
                </div>
              </div>
            )}
            {status === "done" && (
              <span className="absolute left-2 top-2 flex items-center gap-1.5 border border-line bg-background px-2 py-1 text-[11px] text-accent">
                <CheckIcon className="h-3 w-3" />
                ready
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[13px]">{file?.name}</p>
              <p className="text-[11px] text-muted">
                {status === "processing"
                  ? `${active.label} · ${phase ?? "inference in progress"}`
                  : `${active.label} · ${elapsed.toFixed(1)}s · png with alpha`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {status === "done" && (
                <span className="flex gap-1 text-[11px]">
                  <button
                    onClick={() => setView("result")}
                    className={`px-1 transition-colors ${
                      view === "result"
                        ? "text-accent"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    [result]
                  </button>
                  <button
                    onClick={() => setView("original")}
                    className={`px-1 transition-colors ${
                      view === "original"
                        ? "text-accent"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    [original]
                  </button>
                </span>
              )}
              <button
                onClick={reset}
                className="border border-line px-3 py-1.5 text-[13px] transition-colors hover:bg-foreground hover:text-background"
              >
                start over
              </button>
              <button
                onClick={download}
                disabled={status !== "done"}
                className="border border-line bg-foreground px-3 py-1.5 text-[13px] text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
              >
                download
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 border-t border-line pt-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted">
          model
        </p>
        <div className="mt-1.5">
          {MODELS.map((m) => (
            <button
              key={m.id}
              onClick={() => setModel(m.id)}
              className="group flex w-full items-baseline gap-3 py-1 text-left"
            >
              <span
                className={`text-[13px] ${
                  model === m.id ? "text-accent" : "text-muted"
                }`}
              >
                {model === m.id ? "[x]" : "[ ]"}
              </span>
              <span
                className={`text-[13px] ${
                  model === m.id
                    ? "text-foreground"
                    : "text-muted group-hover:text-foreground"
                }`}
              >
                {m.label}
              </span>
              <span className="hidden text-[11px] text-muted sm:inline">
                {model === m.id ? activeDetail : m.detail}
              </span>
            </button>
          ))}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const picked = e.target.files?.[0];
          if (picked) start(picked);
          e.target.value = "";
        }}
      />
    </Panel>
  );
}
