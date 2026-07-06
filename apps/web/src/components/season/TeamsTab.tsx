"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, X } from "lucide-react";
import { useSeasonStore, type TeamInfo } from "@/stores/seasonStore";
import { F1Loader } from "@/components/ui/f1-loader";
import { animate } from "animejs";

// Lightbox component for enlarged images with zoom animation from origin
interface LightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
  type: "car" | "driver";
  origin: { x: number; y: number };
}

function ImageLightbox({ src, alt, onClose, type, origin }: LightboxProps) {
  const [animState, setAnimState] = useState<"opening" | "open" | "closing">("opening");

  const handleClose = useCallback(() => {
    setAnimState("closing");
    setTimeout(onClose, 200);
  }, [onClose]);

  // Trigger opening animation
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnimState("open");
      });
    });
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [handleClose]);

  // For driver images, get full body by using gravity north (top-down) crop
  const displaySrc = type === "driver"
    ? src.replace("c_fill,g_face,w_320,h_320", "c_fill,g_north,w_240,h_400")
    : src;

  // Calculate center position
  const centerX = typeof window !== "undefined" ? window.innerWidth / 2 : 0;
  const centerY = typeof window !== "undefined" ? window.innerHeight / 2 : 0;

  // When closed/opening: position at origin. When open: position at center
  const isOpen = animState === "open";
  const x = isOpen ? centerX : origin.x;
  const y = isOpen ? centerY : origin.y;

  return (
    <div
      className={`fixed inset-0 z-50 transition-colors duration-200 ${
        isOpen ? "bg-black/50" : "bg-black/0"
      }`}
      onClick={handleClose}
    >
      <div
        className={`absolute bg-card rounded-lg shadow-2xl border border-border p-2 transition-all duration-200 ease-out ${
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0"
        }`}
        style={{
          left: x,
          top: y,
          transform: "translate(-50%, -50%)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute -top-2 -right-2 p-1 rounded-full bg-secondary hover:bg-secondary/80 border border-border transition-colors z-10"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </button>
        <Image
          src={displaySrc}
          alt={alt}
          width={type === "car" ? 400 : 240}
          height={type === "car" ? 200 : 400}
          className="object-contain rounded"
          unoptimized
        />
        <p className="text-xs text-center text-muted-foreground mt-1">{alt}</p>
      </div>
    </div>
  );
}

// Car image URLs from F1 media
const CAR_IMAGES: Record<string, string> = {
  "McLaren": "https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2024/mclaren.png.transform/4col/image.png",
  "Ferrari": "https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2024/ferrari.png.transform/4col/image.png",
  "Red Bull Racing": "https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2024/red-bull-racing.png.transform/4col/image.png",
  "Mercedes": "https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2024/mercedes.png.transform/4col/image.png",
  "Aston Martin": "https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2024/aston-martin.png.transform/4col/image.png",
  "Alpine": "https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2024/alpine.png.transform/4col/image.png",
  "Williams": "https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2024/williams.png.transform/4col/image.png",
  "Racing Bulls": "https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2024/rb.png.transform/4col/image.png",
  "Audi": "https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2024/kick-sauber.png.transform/4col/image.png",
  "Haas": "https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2024/haas.png.transform/4col/image.png",
  "Cadillac": "", // New team - no car image yet
};

interface DriverCardProps {
  driver: TeamInfo["drivers"][0];
  teamColor: string;
  compact?: boolean;
  onImageClick?: (src: string, alt: string, origin: { x: number; y: number }) => void;
}

function DriverCard({ driver, teamColor, compact = false, onImageClick }: DriverCardProps) {
  const driverName = `${driver.firstName} ${driver.lastName}`;

  if (compact) {
    return (
      <div
        className="flex-1 p-2.5 bg-secondary/30 rounded-lg border-l-2 flex gap-2"
        style={{ borderLeftColor: teamColor }}
      >
        {/* Driver Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-base font-mono font-bold">#{driver.number}</span>
            <span>{driver.flag}</span>
          </div>
          <div className="text-xs text-muted-foreground">{driver.firstName}</div>
          <div className="font-bold uppercase text-sm">{driver.lastName}</div>
          <div className="mt-1.5 text-xs">
            <span className="font-mono font-bold">{driver.points}</span>
            <span className="text-muted-foreground"> pts</span>
          </div>
        </div>
        {/* Driver Headshot */}
        {driver.imageUrl && (
          <div
            className="flex-shrink-0 w-16 h-16 relative rounded-full overflow-hidden bg-secondary/50 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              onImageClick?.(driver.imageUrl!, driverName, {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
              });
            }}
          >
            <Image
              src={driver.imageUrl}
              alt={driverName}
              fill
              className="object-cover object-top"
              unoptimized
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex-1 min-w-[140px] p-3 bg-secondary/30 rounded-lg border-l-2 flex gap-3"
      style={{ borderLeftColor: teamColor }}
    >
      {/* Driver Info */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg font-mono font-bold">#{driver.number}</span>
          <span className="text-lg">{driver.flag}</span>
        </div>
        <div className="space-y-0.5">
          <div className="text-sm text-muted-foreground">{driver.firstName}</div>
          <div className="font-bold uppercase">{driver.lastName}</div>
        </div>
        <div className="mt-2 text-sm">
          <span className="font-mono font-bold">{driver.points}</span>
          <span className="text-muted-foreground"> pts</span>
        </div>
      </div>
      {/* Driver Headshot */}
      {driver.imageUrl && (
        <div
          className="flex-shrink-0 w-20 h-20 relative rounded-full overflow-hidden bg-secondary/50 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            onImageClick?.(driver.imageUrl!, driverName, {
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2,
            });
          }}
        >
          <Image
            src={driver.imageUrl}
            alt={driverName}
            fill
            className="object-cover object-top"
            unoptimized
          />
        </div>
      )}
    </div>
  );
}

interface TeamCardProps {
  team: TeamInfo;
  index: number;
  onImageClick: (src: string, alt: string, type: "car" | "driver", origin: { x: number; y: number }) => void;
}

function TeamCard({ team, index, onImageClick }: TeamCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const carImage = CAR_IMAGES[team.name];

  useEffect(() => {
    if (!cardRef.current) return;

    animate(cardRef.current, {
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 400,
      delay: index * 80,
      ease: "outQuad",
    });
  }, [index]);

  const handleDriverImageClick = useCallback((src: string, alt: string, origin: { x: number; y: number }) => {
    onImageClick(src, alt, "driver", origin);
  }, [onImageClick]);

  return (
    <Card
      ref={cardRef}
      className="bg-card border-border overflow-hidden h-full flex flex-col"
      style={{ opacity: 0 }}
    >
      {/* Header */}
      <div
        className="p-3"
        style={{ borderLeft: `4px solid ${team.color}` }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase text-sm">{team.name}</span>
              {team.isNew && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/30">
                  NEW
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{team.fullName}</span>
          </div>
          <div className="text-right text-sm">
            {team.position > 0 ? (
              <span className="text-muted-foreground">
                P{team.position}
              </span>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
            <span className="mx-1.5 text-muted-foreground">•</span>
            <span className="font-mono font-bold">{team.points}</span>
            <span className="text-muted-foreground text-xs"> pts</span>
          </div>
        </div>
      </div>

      {/* Car Image + Team Details Row */}
      <div className="px-3 py-2 bg-gradient-to-r from-secondary/20 to-transparent flex items-center gap-4">
        {/* Car Image */}
        <div className="flex-1 min-w-0">
          {carImage ? (
            <div
              className="relative h-14 w-full cursor-pointer hover:opacity-80 transition-opacity"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                onImageClick(carImage, `${team.name} car`, "car", {
                  x: rect.left + rect.width / 2,
                  y: rect.top + rect.height / 2,
                });
              }}
            >
              <Image
                src={carImage}
                alt={`${team.name} car`}
                fill
                className="object-contain object-left"
                unoptimized
              />
            </div>
          ) : team.isNew ? (
            <div className="h-14 flex items-center text-muted-foreground">
              <Car className="h-6 w-6 mr-2 opacity-30" />
              <span className="text-xs">2026 car pending</span>
            </div>
          ) : (
            <div className="h-14" />
          )}
        </div>

        {/* Team Details */}
        <div className="flex-shrink-0 grid grid-cols-1 gap-0.5 text-xs text-right">
          <div>
            <span className="text-muted-foreground">Engine: </span>
            <span className="font-medium">{team.engine}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Base: </span>
            <span className="font-medium">{team.base.split(",")[0]}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Principal: </span>
            <span className="font-medium">{team.principal}</span>
          </div>
        </div>
      </div>

      {/* Drivers */}
      <div className="px-3 py-2 flex gap-2 mt-auto">
        {team.drivers.map((driver) => (
          <DriverCard
            key={driver.code}
            driver={driver}
            teamColor={team.color}
            compact
            onImageClick={handleDriverImageClick}
          />
        ))}
      </div>
    </Card>
  );
}

export function TeamsTab() {
  const { teams, isLoading } = useSeasonStore();
  const [lightbox, setLightbox] = useState<{
    src: string;
    alt: string;
    type: "car" | "driver";
    origin: { x: number; y: number };
  } | null>(null);

  const handleImageClick = useCallback((src: string, alt: string, type: "car" | "driver", origin: { x: number; y: number }) => {
    setLightbox({ src, alt, type, origin });
  }, []);

  const closeLightbox = useCallback(() => {
    setLightbox(null);
  }, []);

  if (isLoading && teams.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <F1Loader text="Loading teams..." />
      </div>
    );
  }

  // If no teams loaded from API, use static data
  const displayTeams = teams.length > 0 ? teams : [];

  if (displayTeams.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Team information will be available soon.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="text-sm text-muted-foreground">
          {displayTeams.length} Teams • 22 Drivers • 2026 Season
        </div>

        {/* Team Cards - Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {displayTeams.map((team, index) => (
            <TeamCard
              key={team.name}
              team={team}
              index={index}
              onImageClick={handleImageClick}
            />
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <ImageLightbox
          src={lightbox.src}
          alt={lightbox.alt}
          type={lightbox.type}
          origin={lightbox.origin}
          onClose={closeLightbox}
        />
      )}
    </>
  );
}
