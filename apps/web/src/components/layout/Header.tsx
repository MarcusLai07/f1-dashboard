"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useDebugStore } from "@/stores/debugStore";

interface HeaderProps {
  sessionName?: string;
  isLive?: boolean;
}

export function Header({ sessionName, isLive = false }: HeaderProps) {
  const pathname = usePathname();
  const { enabled: debugEnabled } = useDebugStore();

  return (
    <header className="h-12 border-b border-border bg-card px-4 flex items-center justify-between">
      {/* Logo & Nav */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">F1</span>
          <span className="text-lg font-semibold">Dashboard</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              pathname === "/"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            Live
          </Link>
          <Link
            href="/analysis"
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              pathname === "/analysis"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            Analysis
          </Link>
          <Link
            href="/season"
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              pathname === "/season"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            Season
          </Link>
          <Link
            href="/calendar"
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              pathname === "/calendar"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            Calendar
          </Link>
          <Link
            href="/about"
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              pathname === "/about"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            About
          </Link>
          {debugEnabled && (
            <Link
              href="/circuit-editor"
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                pathname === "/circuit-editor"
                  ? "bg-primary/20 text-primary"
                  : "text-primary/70 hover:text-primary hover:bg-primary/10"
              )}
            >
              Circuit Editor
            </Link>
          )}
        </nav>
      </div>

      {/* Session Info */}
      <div className="flex items-center gap-3">
        {sessionName && (
          <span className="text-sm text-muted-foreground">{sessionName}</span>
        )}
        {isLive && (
          <Badge variant="destructive" className="animate-pulse">
            LIVE
          </Badge>
        )}
      </div>
    </header>
  );
}
