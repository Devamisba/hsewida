import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface QRCodeSVGProps {
  value: string;
  size?: number;
  className?: string;
  color?: {
    dark?: string;
    light?: string;
  };
}

export function QRCodeSVG({ value, size = 160, className = "", color = { dark: "#0f172a", light: "#ffffff" } }: QRCodeSVGProps) {
  const [svgString, setSvgString] = useState<string>("");

  useEffect(() => {
    if (!value) return;

    QRCode.toString(value, {
      type: "svg",
      width: size,
      margin: 1,
      color: {
        dark: color.dark || "#0f172a",
        light: color.light || "#ffffff",
      },
      errorCorrectionLevel: "M",
    })
      .then((svg) => {
        setSvgString(svg);
      })
      .catch((err) => {
        console.error("Failed generating QR Code SVG:", err);
      });
  }, [value, size, color.dark, color.light]);

  if (!svgString) {
    return (
      <div 
        style={{ width: size, height: size }} 
        className={`bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-xs text-slate-400 ${className}`}
      >
        Generating QR...
      </div>
    );
  }

  return (
    <div
      className={`inline-block ${className}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
}
