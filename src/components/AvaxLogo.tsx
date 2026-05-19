interface AvaxLogoProps {
  className?: string;
  dark?: boolean; // true = dark navy gradients (for white backgrounds)
}

export function AvaxLogo({ className = "w-8 h-8", dark = false }: AvaxLogoProps) {
  return dark ? (
    <svg viewBox="0 0 100 88" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="dl" x1="50" y1="0" x2="18" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="60%" stopColor="#475569" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#64748b" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="dr" x1="50" y1="0" x2="82" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#334155" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <path d="M50 2 L2 87 L24 87 L50 30 Z" fill="url(#dl)" />
      <path d="M50 2 L98 87 L76 87 L50 30 Z" fill="url(#dr)" />
    </svg>
  ) : (
    <svg viewBox="0 0 100 88" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="al" x1="50" y1="0" x2="18" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e2e8f0" stopOpacity="1" />
          <stop offset="55%" stopColor="#94a3b8" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#64748b" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="ar" x1="50" y1="0" x2="82" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f1f5f9" stopOpacity="1" />
          <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <path d="M50 2 L2 87 L24 87 L50 30 Z" fill="url(#al)" />
      <path d="M50 2 L98 87 L76 87 L50 30 Z" fill="url(#ar)" />
    </svg>
  );
}
