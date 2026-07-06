"use client";

import { Header } from "@/components/layout/Header";
import { MotorsportCalendar } from "@/components/calendar";

export default function CalendarPage() {
  return (
    <div className="h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 overflow-hidden">
        <MotorsportCalendar />
      </main>
    </div>
  );
}
