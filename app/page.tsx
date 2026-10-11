import Link from "next/link";
import ThemeToggle from "./components/theme-toggle";
import UploadZone from "./components/upload-zone";
import DeviceStatus from "./components/device-status";
import Panel from "./components/panel";
import { ScissorsIcon } from "./components/icons";
import { SITE_NAME } from "./site";

const STEPS = [
  "drop, pick or paste an image",
  "your gpu runs the model",
  "download the png with alpha",
];

const SPEC: [string, string][] = [
  ["formats", "png jpg webp avif gif bmp"],
  ["max size", "32 mb"],
  ["models", "rmbg-1.4 · birefnet-lite"],
  ["output", "full resolution png"],
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-5">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center border border-line text-muted transition-colors group-hover:bg-foreground group-hover:text-background">
              <ScissorsIcon className="h-3.5 w-3.5" />
            </span>
            <span className="text-[15px] font-medium">{SITE_NAME}</span>
            <span className="text-[11px] text-muted">0.1.0</span>
          </Link>

          <nav className="flex items-center gap-5 text-[13px] text-muted">
            <a href="#notes" className="transition-colors hover:text-foreground">
              notes
            </a>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="flex-1 px-5 py-10 sm:py-14">
        <div className="mx-auto w-full max-w-3xl space-y-9">
          <Panel label="main" className="px-5 py-8 sm:px-8 sm:py-10">
            <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
              free background remover
              <span className="animate-blink ml-1 inline-block h-[0.7em] w-[0.5ch] bg-foreground align-[-0.05em]" />
            </h1>
            <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-muted">
              drop an image, get a cutout. inference runs on this machine,
              nothing is uploaded anywhere.
            </p>

            <div className="mt-7">
              <UploadZone />
            </div>

            <p className="mt-5 flex items-center gap-2 text-[13px] text-accent">
              <span aria-hidden>✓</span>
              processed locally. your photos never leave this device
            </p>
          </Panel>

          <div id="notes" className="grid scroll-mt-20 gap-9 sm:grid-cols-2">
            <Panel label="notes" className="p-5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted">
                how it works
              </p>
              <ol className="mt-3 space-y-1.5">
                {STEPS.map((step, i) => (
                  <li key={step} className="flex gap-3 text-[13px]">
                    <span className="text-muted">{String(i + 1).padStart(2, "0")}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </Panel>

            <Panel label="spec" className="p-5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted">
                engine
              </p>
              <dl className="mt-3 space-y-1.5 text-[13px]">
                {SPEC.map(([key, value]) => (
                  <div key={key} className="flex gap-4">
                    <dt className="w-20 shrink-0 text-muted">{key}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
                <DeviceStatus />
              </dl>
              <p className="mt-4 text-[11px] leading-relaxed text-muted">
                {"// rmbg-1.4: non-commercial · birefnet-lite: mit · all on-device"}
              </p>
            </Panel>
          </div>
        </div>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 px-5 py-4 text-[12px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{`${SITE_NAME} // background remover`}</p>
          <nav className="flex items-center gap-5">
            <a href="#notes" className="transition-colors hover:text-foreground">
              notes
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
