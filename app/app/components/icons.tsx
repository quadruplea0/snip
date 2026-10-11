import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export function LogoIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="6" y="6" width="12" height="12" rx="2" transform="rotate(45 12 12)" />
      <path d="M9.5 14.5l5-5" />
    </Svg>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 16V4m0 0L8 8m4-4l4 4" />
      <path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" />
    </Svg>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 4v12m0 0l4-4m-4 4l-4-4" />
      <path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" />
    </Svg>
  );
}

export function SparklesIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
    </Svg>
  );
}

export function ScissorsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="6" cy="6" r="3" />
      <path d="M8.1 8.1 12 12" />
      <path d="M20 4 8.1 15.9" />
      <circle cx="6" cy="18" r="3" />
      <path d="M14.5 14.5 20 20" />
    </Svg>
  );
}

export function ZapIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M13 2 3 14h8l-1 8 10-12h-8l1-8z" />
    </Svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 22s8-3.6 8-10V5l-8-3-8 3v7c0 6.4 8 10 8 10z" />
    </Svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 6L9 17l-5-5" />
    </Svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.3 11.3l1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.3-11.3l1.4-1.4" />
    </Svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
    </Svg>
  );
}

export function CropIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 2v14a2 2 0 002 2h14" />
      <path d="M2 6h14a2 2 0 012 2v14" />
    </Svg>
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M19 14c1.5-1.5 3-3.3 3-5.5A5.5 5.5 0 0016.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 002 8.5c0 2.2 1.5 4 3 5.5l7 7 7-7z" />
    </Svg>
  );
}
