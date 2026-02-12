"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Header } from "@/components/layout/Header";
import { useDebugStore } from "@/stores/debugStore";

// Dynamically import CircuitEditor to avoid SSR issues with Leaflet
const CircuitEditor = dynamic(
  () => import("@/components/debug/CircuitEditor"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading map...</div>
      </div>
    )
  }
);

export default function CircuitEditorPage() {
  const router = useRouter();
  const { enabled: debugEnabled } = useDebugStore();

  // Redirect if debug mode is not enabled
  useEffect(() => {
    if (!debugEnabled) {
      router.push("/");
    }
  }, [debugEnabled, router]);

  // Don't render if debug mode is off
  if (!debugEnabled) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header sessionName="Circuit Editor (Debug)" />
      <main className="flex-1 overflow-hidden">
        <CircuitEditor />
      </main>
    </div>
  );
}
