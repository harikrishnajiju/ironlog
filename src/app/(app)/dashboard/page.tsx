"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/auth";
import { db } from "@/lib/firebase/client";
import { collection, query, orderBy, limit, getDocs, doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRoleForLevel } from "@/lib/xp";
import { Flame, Brain, Zap, Activity, Dumbbell } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { generateDailyMotivation, generateWorkoutSuggestion } from "@/lib/gemini";

export default function DashboardPage() {
  const { user, profile } = useAuthStore();
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);
  const [weeklyVolume, setWeeklyVolume] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [motivation, setMotivation] = useState<string>("Initializing tactical AI...");
  const [suggestion, setSuggestion] = useState<string>("Analyzing parameters...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile) return;

    const fetchDashboardData = async () => {
      try {
        // 1. Fetch recent workouts
        const workoutsRef = collection(db, "users", user.uid, "workouts");
        const q = query(workoutsRef, orderBy("date", "desc"), limit(7));
        const snapshot = await getDocs(q);
        
        const workouts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          dateStr: doc.data().date?.toDate().toLocaleDateString('en-US', { weekday: 'short' }) || ''
        }));
        setRecentWorkouts(workouts);

        // Calculate weekly volume and prepare chart data
        let totalVol = 0;
        const volumeByDay: Record<string, number> = {};
        
        // Initialize last 7 days
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          volumeByDay[d.toLocaleDateString('en-US', { weekday: 'short' })] = 0;
        }

        workouts.forEach(w => {
          totalVol += (w.volume || 0);
          if (volumeByDay[w.dateStr] !== undefined) {
            volumeByDay[w.dateStr] += (w.volume || 0);
          }
        });
        
        setWeeklyVolume(totalVol);
        setChartData(Object.keys(volumeByDay).map(day => ({
          name: day,
          volume: volumeByDay[day]
        })));

        // 2. Fetch or Generate AI Motivation & Suggestion
        const todayStr = new Date().toISOString().split("T")[0];
        const dailyRef = doc(db, "users", user.uid, "daily", todayStr);
        const dailyDoc = await getDoc(dailyRef);

        if (dailyDoc.exists()) {
          const data = dailyDoc.data();
          setMotivation(data.motivation);
          setSuggestion(data.suggestion);
        } else {
          // Generate new AI content
          const safeWorkoutsForServer = workouts.map(w => ({ type: w.type || "unknown" }));
          const safeProfileForServer = {
            displayName: profile.displayName,
            goal: profile.goal,
            level: profile.level
          } as any;

          const [newMotivation, newSuggestion] = await Promise.all([
            generateDailyMotivation(safeProfileForServer),
            generateWorkoutSuggestion(safeProfileForServer, safeWorkoutsForServer)
          ]);
          
          setMotivation(newMotivation);
          setSuggestion(newSuggestion);
          
          // Cache it for today
          await setDoc(dailyRef, {
            motivation: newMotivation,
            suggestion: newSuggestion,
            createdAt: Timestamp.now()
          });
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, profile]);

  if (!profile) return null;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-mono font-bold uppercase tracking-tighter text-primary">Command Center</h2>
        <p className="text-muted-foreground text-sm uppercase tracking-widest mt-1">Status Report</p>
      </div>
      
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-border relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Flame className="w-16 h-16 text-primary" /></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono uppercase text-muted-foreground">Current Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-mono font-bold text-primary">{profile.currentStreak} <span className="text-xl">DAYS</span></div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Activity className="w-16 h-16 text-white" /></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono uppercase text-muted-foreground">Weekly Tonnage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-mono font-bold text-white">{(weeklyVolume / 1000).toFixed(1)} <span className="text-xl">TONS</span></div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Zap className="w-16 h-16 text-accent" /></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono uppercase text-muted-foreground">Classification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-mono font-bold text-accent tracking-tighter uppercase">{getRoleForLevel(profile.level)}</div>
            <div className="text-sm font-mono text-muted-foreground mt-1">Level {profile.level}</div>
          </CardContent>
        </Card>
      </div>

      {/* AI Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-primary/30 shadow-[0_0_15px_rgba(204,255,0,0.05)]">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <Brain className="w-5 h-5 text-primary" />
            <CardTitle className="text-sm font-mono uppercase text-primary">Directives</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-12 bg-secondary rounded animate-pulse"></div>
            ) : (
              <blockquote className="text-lg font-mono italic text-white border-l-2 border-primary pl-4">
                "{motivation}"
              </blockquote>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <Dumbbell className="w-5 h-5 text-white" />
            <CardTitle className="text-sm font-mono uppercase text-white">Tactical Suggestion</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-12 bg-secondary rounded animate-pulse"></div>
            ) : (
              <p className="text-base font-mono text-muted-foreground">
                {suggestion}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chart Row */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-mono uppercase text-muted-foreground">7-Day Volume Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {loading ? (
              <div className="w-full h-full bg-secondary/50 rounded animate-pulse flex items-center justify-center font-mono text-sm uppercase text-muted-foreground">Loading Telemetry...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#666" tick={{fontFamily: 'monospace', fontSize: 12}} />
                  <YAxis stroke="#666" tick={{fontFamily: 'monospace', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#1a1a1a'}}
                    contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', fontFamily: 'monospace' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="volume" fill="#fff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

