"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";

interface F1LoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

export function F1Loader({ size = "md", text = "Loading..." }: F1LoaderProps) {
  const rearWheelRef = useRef<SVGGElement>(null);
  const frontWheelRef = useRef<SVGGElement>(null);
  const carRef = useRef<SVGGElement>(null);

  const sizes = {
    sm: { width: 120, height: 48, textSize: "text-xs" },
    md: { width: 160, height: 64, textSize: "text-sm" },
    lg: { width: 200, height: 80, textSize: "text-base" },
  };

  const { width, height, textSize } = sizes[size];

  useEffect(() => {
    if (rearWheelRef.current) {
      animate(rearWheelRef.current, {
        rotate: "360deg",
        duration: 350,
        loop: true,
        easing: "linear",
      });
    }

    if (frontWheelRef.current) {
      animate(frontWheelRef.current, {
        rotate: "360deg",
        duration: 350,
        loop: true,
        easing: "linear",
      });
    }

    if (carRef.current) {
      animate(carRef.current, {
        translateY: [0, -1, 0],
        duration: 200,
        loop: true,
        easing: "easeInOutQuad",
      });
    }
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        width={width}
        height={height}
        viewBox="0 0 200 80"
        className="overflow-visible"
      >
        <g ref={carRef}>
          {/* Black floor/undertray - the distinctive shape */}
          <path
            d="M30 58
               L30 52
               L45 52
               L50 48
               L85 48
               C95 48 105 52 115 52
               L155 52
               L160 56
               L175 56
               L175 62
               L30 62
               Z"
            fill="#1a1a1a"
          />

          {/* Main red body */}
          <path
            d="M35 52
               L38 42
               L50 35
               L70 28
               L95 24
               L125 24
               L145 28
               L160 35
               L170 42
               L175 48
               L175 52
               L155 52
               L150 48
               L115 48
               C105 48 95 44 85 44
               L50 44
               L45 52
               Z"
            fill="#DC2626"
          />

          {/* Nose cone extending forward */}
          <path
            d="M170 42
               L185 40
               L195 42
               L198 46
               L198 52
               L175 52
               L175 48
               Z"
            fill="#DC2626"
          />

          {/* Front wing */}
          <path
            d="M192 52 L200 50 L200 58 L192 58 Z"
            fill="#DC2626"
          />
          <rect x="196" y="48" width="4" height="14" fill="#1a1a1a" />

          {/* Cockpit/driver area */}
          <path
            d="M90 24
               L95 18
               L115 18
               L120 24"
            fill="#1a1a1a"
          />

          {/* Small airbox/fin */}
          <path
            d="M105 18 L108 10 L112 10 L115 18"
            fill="#1a1a1a"
          />

          {/* Halo - subtle curved bar */}
          <path
            d="M92 24 Q105 16 118 24"
            fill="none"
            stroke="#52525b"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Sidepod cutout detail */}
          <path
            d="M75 35
               L90 32
               L120 32
               L135 35
               L130 44
               L80 44
               Z"
            fill="#B91C1C"
          />

          {/* Rear wing - simple vertical */}
          <rect x="8" y="28" width="4" height="26" rx="1" fill="#DC2626" />
          <rect x="4" y="24" width="10" height="6" rx="1" fill="#DC2626" />
          <rect x="2" y="22" width="4" height="34" rx="1" fill="#1a1a1a" />

          {/* Rear wheel */}
          <g ref={rearWheelRef} style={{ transformOrigin: "50px 58px" }}>
            <circle cx="50" cy="58" r="16" fill="#1a1a1a" />
            <circle cx="50" cy="58" r="11" fill="#FACC15" />
            <circle cx="50" cy="58" r="6" fill="#f5f5f5" />
          </g>

          {/* Front wheel */}
          <g ref={frontWheelRef} style={{ transformOrigin: "160px 58px" }}>
            <circle cx="160" cy="58" r="14" fill="#1a1a1a" />
            <circle cx="160" cy="58" r="10" fill="#FACC15" />
            <circle cx="160" cy="58" r="5" fill="#f5f5f5" />
          </g>
        </g>
      </svg>

      {text && (
        <span className={`${textSize} text-muted-foreground animate-pulse`}>
          {text}
        </span>
      )}
    </div>
  );
}

// Mini F1 car for progress bar
export function MiniF1Car({ spinning = true }: { spinning?: boolean }) {
  const wheelRef = useRef<SVGGElement>(null);
  const frontWheelRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!spinning) return;

    if (wheelRef.current) {
      animate(wheelRef.current, {
        rotate: "360deg",
        duration: 200,
        loop: true,
        easing: "linear",
      });
    }
    if (frontWheelRef.current) {
      animate(frontWheelRef.current, {
        rotate: "360deg",
        duration: 200,
        loop: true,
        easing: "linear",
      });
    }
  }, [spinning]);

  return (
    <svg width="40" height="16" viewBox="0 0 40 16" className="overflow-visible">
      {/* Black floor */}
      <path
        d="M6 12 L6 10 L9 10 L10 9 L17 9 C20 9 22 10 24 10 L31 10 L32 11 L35 11 L35 13 L6 13 Z"
        fill="#1a1a1a"
      />

      {/* Red body */}
      <path
        d="M7 10 L8 7 L11 5 L16 4 L24 4 L29 5 L33 7 L35 9 L35 10 L31 10 L30 9 L24 9 C22 9 20 8 17 8 L10 8 L9 10 Z"
        fill="#DC2626"
      />

      {/* Nose */}
      <path
        d="M34 8 L38 7.5 L40 8.5 L40 10 L35 10 Z"
        fill="#DC2626"
      />

      {/* Cockpit */}
      <path d="M18 4 L19 2.5 L23 2.5 L24 4" fill="#1a1a1a" />

      {/* Rear wing */}
      <rect x="1" y="5" width="2" height="6" rx="0.5" fill="#DC2626" />
      <rect x="0" y="4" width="3" height="8" rx="0.5" fill="#1a1a1a" />

      {/* Rear wheel */}
      <g ref={wheelRef} style={{ transformOrigin: "10px 12px" }}>
        <circle cx="10" cy="12" r="3.5" fill="#1a1a1a" />
        <circle cx="10" cy="12" r="2.3" fill="#FACC15" />
        <circle cx="10" cy="12" r="1.2" fill="#f5f5f5" />
      </g>

      {/* Front wheel */}
      <g ref={frontWheelRef} style={{ transformOrigin: "32px 12px" }}>
        <circle cx="32" cy="12" r="3" fill="#1a1a1a" />
        <circle cx="32" cy="12" r="2" fill="#FACC15" />
        <circle cx="32" cy="12" r="1" fill="#f5f5f5" />
      </g>
    </svg>
  );
}
