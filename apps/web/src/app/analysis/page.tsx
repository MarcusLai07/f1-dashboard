"use client";

import { Header } from "@/components/layout/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AnalysisPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="p-6">
        {/* Session Selector */}
        <div className="flex items-center gap-4 mb-6">
          <select className="bg-secondary text-foreground px-4 py-2 rounded-md border border-border">
            <option>2024</option>
            <option>2023</option>
            <option>2022</option>
          </select>
          <select className="bg-secondary text-foreground px-4 py-2 rounded-md border border-border">
            <option>Monaco Grand Prix</option>
            <option>British Grand Prix</option>
            <option>Italian Grand Prix</option>
          </select>
          <select className="bg-secondary text-foreground px-4 py-2 rounded-md border border-border">
            <option>Race</option>
            <option>Qualifying</option>
            <option>Sprint</option>
          </select>
        </div>

        {/* Analysis Tabs */}
        <Tabs defaultValue="comparison" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="comparison">Driver Comparison</TabsTrigger>
            <TabsTrigger value="replay">Race Replay</TabsTrigger>
            <TabsTrigger value="explorer">Session Explorer</TabsTrigger>
          </TabsList>

          <TabsContent value="comparison">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Driver Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  <p>Select two drivers to compare their telemetry and lap times</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="replay">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Race Replay</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  <p>Step through the race lap by lap and see position changes</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="explorer">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Session Explorer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  <p>Browse all laps, filter by driver, compound, and find patterns</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
