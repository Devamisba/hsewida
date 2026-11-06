import { cn } from '@/lib/utils';

export interface K3LoaderProps {
  /** Ukuran loader: "sm" (32px), "md" (56px), "lg" (96px), "xl" (130px), atau number (px) */
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  /** Label status / keterangan muat data */
  text?: string;
  /** Tampilkan teks slogan resmi "UTAMAKAN KESELAMATAN DAN KESEHATAN KERJA" */
  showSlogan?: boolean;
  /** Mode full screen overlay dengan backdrop blur */
  fullScreen?: boolean;
  /** Custom class tambahan untuk container */
  className?: string;
}

const GEAR_11_TEETH_PATH =
  "M 90.89 36.65 L 90.97 12.46 A 88 88 0 0 1 109.03 12.46 L 109.11 36.65 A 64 64 0 0 1 126.59 41.78 L 139.73 21.48 A 88 88 0 0 1 154.92 31.24 L 141.91 51.63 A 64 64 0 0 1 153.84 65.40 L 175.87 55.42 A 88 88 0 0 1 183.38 71.85 L 161.41 81.97 A 64 64 0 0 1 164.00 100.00 L 187.93 103.52 A 88 88 0 0 1 185.36 121.40 L 161.41 118.03 A 64 64 0 0 1 153.84 134.60 L 172.07 150.50 A 88 88 0 0 1 160.24 164.15 L 141.91 148.37 A 64 64 0 0 1 126.59 158.22 L 133.33 181.44 A 88 88 0 0 1 116.00 186.53 L 109.11 163.35 A 64 64 0 0 1 90.89 163.35 L 84.00 186.53 A 88 88 0 0 1 66.67 181.44 L 73.41 158.22 A 64 64 0 0 1 58.09 148.37 L 39.76 164.15 A 88 88 0 0 1 27.93 150.50 L 46.16 134.60 A 64 64 0 0 1 38.59 118.03 L 14.64 121.40 A 88 88 0 0 1 12.07 103.52 L 36.00 100.00 A 64 64 0 0 1 38.59 81.97 L 16.62 71.85 A 88 88 0 0 1 24.13 55.42 L 46.16 65.40 A 64 64 0 0 1 58.09 51.63 L 45.08 31.24 A 88 88 0 0 1 60.27 21.48 L 73.41 41.78 A 64 64 0 0 1 90.89 36.65 Z M 100 57 A 43 43 0 1 0 100 143 A 43 43 0 1 0 100 57 Z";

export function K3Loader({
  size = 'md',
  text,
  showSlogan = false,
  fullScreen = false,
  className,
}: K3LoaderProps) {
  // Hitung resolusi pixel
  let pixelSize = 56;
  if (typeof size === 'number') {
    pixelSize = size;
  } else {
    switch (size) {
      case 'sm': pixelSize = 32; break;
      case 'md': pixelSize = 56; break;
      case 'lg': pixelSize = 96; break;
      case 'xl': pixelSize = 136; break;
    }
  }

  const content = (
    <div className={cn("inline-flex flex-col items-center justify-center gap-3 select-none", className)}>
      {/* Container Lambang K3 */}
      <div 
        className="relative flex items-center justify-center shrink-0"
        style={{ width: pixelSize, height: pixelSize }}
      >
        {/* Lingkaran luar glowing halus (efek aura K3) */}
        {pixelSize >= 56 && (
          <div 
            className="absolute inset-0 rounded-full bg-emerald-500/10 blur-md pointer-events-none animate-pulse" 
            style={{ transform: 'scale(1.15)' }} 
          />
        )}

        <svg 
          viewBox="0 0 200 200" 
          width={pixelSize} 
          height={pixelSize}
          className="overflow-visible drop-shadow-xs"
        >
          {/* Layer 1: Roda Gigi Luar (11 Gerigi) - Berputar searah jarum jam */}
          <g className="animate-k3-gear origin-center">
            <path
              d={GEAR_11_TEETH_PATH}
              fill="#1b6b38"
              fillRule="evenodd"
            />
          </g>

          {/* Layer 2: Lingkaran Putih di Bagian Tengah */}
          <circle cx="100" cy="100" r="42" fill="#ffffff" />

          {/* Layer 3: Palang Hijau (+) - Tetap Tegak Lurus & Berdenyut Lembut */}
          <g className="animate-k3-cross origin-center">
            {/* Batang Vertikal */}
            <rect 
              x="91.5" 
              y="69" 
              width="17" 
              height="62" 
              rx="1.5" 
              fill="#1b6b38" 
            />
            {/* Batang Horizontal */}
            <rect 
              x="69" 
              y="91.5" 
              width="62" 
              height="17" 
              rx="1.5" 
              fill="#1b6b38" 
            />
          </g>
        </svg>
      </div>

      {/* Teks Slogan K3 Resmi */}
      {showSlogan && pixelSize >= 56 && (
        <div className="flex flex-col items-center text-center mt-1">
          <span className="text-[12px] sm:text-[13px] font-extrabold uppercase tracking-wide animate-k3-shimmer leading-tight">
            Utamakan Keselamatan
          </span>
          <span className="text-[12px] sm:text-[13px] font-extrabold uppercase tracking-wide animate-k3-shimmer leading-tight">
            dan Kesehatan Kerja
          </span>
        </div>
      )}

      {/* Subteks / Label Proses */}
      {text && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 tracking-wide mt-0.5">
          <span>{text}</span>
          <span className="inline-flex gap-0.5">
            <span className="w-1 h-1 rounded-full bg-emerald-600 animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1 h-1 rounded-full bg-emerald-600 animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1 h-1 rounded-full bg-emerald-600 animate-bounce" />
          </span>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white/95 px-8 py-7 rounded-2xl shadow-2xl border border-slate-100 flex flex-col items-center">
          {content}
        </div>
      </div>
    );
  }

  return content;
}

export default K3Loader;
