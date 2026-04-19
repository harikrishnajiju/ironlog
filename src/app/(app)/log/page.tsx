"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "@/lib/store/auth";
import { db } from "@/lib/firebase/client";
import { collection, doc, runTransaction, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { calculateNewStreak } from "@/lib/streaks";
import { calculateWorkoutXP, calculateLevel } from "@/lib/xp";
import exercises from "@/constants/exercises.json";
import achievementsList from "@/constants/achievements.json";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Dumbbell } from "lucide-react";
import { AchievementModal } from "@/components/ui/AchievementModal";

const workoutSchema = z.object({
  date: z.string().min(1, "Date is required"),
  type: z.enum(["strength", "cardio", "mobility"]),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute"),
  exercises: z.array(z.object({
    exerciseId: z.string().min(1, "Exercise selection is required"),
    sets: z.coerce.number().min(1),
    reps: z.coerce.number().min(1),
    weight: z.coerce.number().min(0),
  })).min(1, "At least one exercise is required"),
});

type WorkoutFormValues = z.infer<typeof workoutSchema>;

export default function LogWorkoutPage() {
  const { user, profile, setProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: "success" | "error" } | null>(null);
  
  const [unlockedAchievement, setUnlockedAchievement] = useState<any | null>(null);
  
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<WorkoutFormValues>({
    resolver: zodResolver(workoutSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      type: "strength",
      duration: 60,
      exercises: [{ exerciseId: "bench_press", sets: 3, reps: 10, weight: 60 }],
    }
  });

  const { fields, append, remove } = useFieldArray({
    name: "exercises",
    control
  });

  if (!user || !profile) return null;

  const onSubmit = async (data: WorkoutFormValues) => {
    setLoading(true);
    setMessage(null);
    try {
      const userRef = doc(db, "users", user.uid);
      const workoutsRef = collection(userRef, "workouts");
      const newWorkoutRef = doc(workoutsRef);

      const workoutDate = new Date(data.date);
      const workoutTimestamp = Timestamp.fromDate(workoutDate);

      const earnedXP = calculateWorkoutXP(data.exercises.length);
      
      let newProfileData: any = {};
      let newlyUnlocked: any = null;

      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("User document does not exist!");

        const userData = userDoc.data();
        const currentXP = userData.xp || 0;
        const currentStreak = userData.currentStreak || 0;
        const longestStreak = userData.longestStreak || 0;
        const existingAchievements = userData.achievements || [];
        
        let lastWorkoutDate = null;
        if (userData.lastWorkoutDate) {
          lastWorkoutDate = userData.lastWorkoutDate.toDate();
        }

        const newStreak = calculateNewStreak(lastWorkoutDate, currentStreak);
        const newLongestStreak = Math.max(newStreak, longestStreak);
        const newXP = currentXP + earnedXP;
        const newLevel = calculateLevel(newXP);

        // Calculate total volume for this workout
        const volume = data.exercises.reduce((acc, ex) => acc + (ex.sets * ex.reps * ex.weight), 0);

        // Achievement Logic
        const unlockedIds = existingAchievements;
        const checkUnlock = (id: string, condition: boolean) => {
          if (!unlockedIds.includes(id) && condition) {
            unlockedIds.push(id);
            newlyUnlocked = achievementsList.find(a => a.id === id);
          }
        };

        checkUnlock("first_rep", true);
        checkUnlock("week_warrior", newStreak >= 7);
        checkUnlock("month_monster", newStreak >= 30);
        checkUnlock("iron_will", volume >= 10000);
        
        // Early bird check
        const hour = workoutDate.getHours();
        const existingEarlyBirds = userData.earlyBirdCount || 0;
        const newEarlyBirds = hour < 8 ? existingEarlyBirds + 1 : existingEarlyBirds;
        checkUnlock("early_bird", newEarlyBirds >= 5);

        const workoutData = {
          ...data,
          date: workoutTimestamp,
          volume,
          earnedXP,
          createdAt: Timestamp.now(),
        };

        newProfileData = {
          xp: newXP,
          level: newLevel,
          currentStreak: newStreak,
          longestStreak: newLongestStreak,
          lastWorkoutDate: workoutTimestamp,
          achievements: unlockedIds,
          earlyBirdCount: newEarlyBirds,
          updatedAt: Timestamp.now(),
        };

        transaction.set(newWorkoutRef, workoutData);
        transaction.update(userRef, newProfileData);
      });

      // Update local state
      setProfile({
        ...profile,
        ...newProfileData,
        lastWorkoutDate: newProfileData.lastWorkoutDate,
      });

      setMessage({ text: `Workout logged! You earned ${earnedXP} XP.`, type: "success" });
      reset();
      
      if (newlyUnlocked) {
        setUnlockedAchievement(newlyUnlocked);
      } else {
        setTimeout(() => router.push("/dashboard"), 2000);
      }
      
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.message || "Failed to log workout.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setUnlockedAchievement(null);
    router.push("/dashboard");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <AchievementModal 
        isOpen={!!unlockedAchievement} 
        achievement={unlockedAchievement} 
        onClose={handleModalClose} 
      />

      <div>
        <h2 className="text-3xl font-mono font-bold uppercase tracking-tighter text-primary">Log Protocol</h2>
        <p className="text-muted-foreground text-sm uppercase tracking-widest mt-1">Record your mission data</p>
      </div>

      <Card className="bg-card border-border shadow-lg">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Workout Meta */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" {...register("date")} className="bg-input border-border focus-visible:ring-primary" />
                {errors.date && <p className="text-destructive text-sm">{errors.date.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <select 
                  id="type" 
                  {...register("type")} 
                  className="flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="strength">Strength</option>
                  <option value="cardio">Cardio</option>
                  <option value="mobility">Mobility</option>
                </select>
                {errors.type && <p className="text-destructive text-sm">{errors.type.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (mins)</Label>
                <Input id="duration" type="number" {...register("duration")} className="bg-input border-border focus-visible:ring-primary" />
                {errors.duration && <p className="text-destructive text-sm">{errors.duration.message}</p>}
              </div>
            </div>

            <Separator className="bg-border" />

            {/* Exercises Array */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-mono uppercase text-white flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-primary" />
                  Exercises
                </h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => append({ exerciseId: exercises[0].id, sets: 3, reps: 10, weight: 0 })}
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground font-mono uppercase text-xs"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Movement
                </Button>
              </div>

              {errors.exercises?.root && <p className="text-destructive text-sm">{errors.exercises.root.message}</p>}

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 border border-border bg-secondary rounded-lg relative flex flex-col md:flex-row gap-4 items-start md:items-end">
                    
                    <div className="flex-1 w-full space-y-2">
                      <Label>Movement</Label>
                      <select 
                        {...register(`exercises.${index}.exerciseId`)}
                        className="flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        {exercises.map(ex => (
                          <option key={ex.id} value={ex.id}>{ex.name} ({ex.category})</option>
                        ))}
                      </select>
                      {errors.exercises?.[index]?.exerciseId && <p className="text-destructive text-sm">{errors.exercises[index]?.exerciseId?.message}</p>}
                    </div>

                    <div className="w-full md:w-24 space-y-2">
                      <Label>Sets</Label>
                      <Input type="number" {...register(`exercises.${index}.sets`)} className="bg-input border-border focus-visible:ring-primary" />
                    </div>

                    <div className="w-full md:w-24 space-y-2">
                      <Label>Reps</Label>
                      <Input type="number" {...register(`exercises.${index}.reps`)} className="bg-input border-border focus-visible:ring-primary" />
                    </div>

                    <div className="w-full md:w-24 space-y-2">
                      <Label>Weight (kg)</Label>
                      <Input type="number" step="0.5" {...register(`exercises.${index}.weight`)} className="bg-input border-border focus-visible:ring-primary" />
                    </div>

                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => remove(index)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 mb-0.5"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                ))}
                {fields.length === 0 && (
                  <div className="text-center p-8 border border-dashed border-border rounded-lg text-muted-foreground font-mono text-sm uppercase">
                    No movements added. Add a movement to continue.
                  </div>
                )}
              </div>
            </div>

            {message && (
              <div className={`p-4 rounded-md border text-sm font-mono font-bold uppercase ${message.type === 'success' ? 'bg-primary/10 border-primary text-primary' : 'bg-destructive/10 border-destructive text-destructive'}`}>
                {message.text}
              </div>
            )}

            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-wider h-12 text-lg" disabled={loading || fields.length === 0}>
              {loading ? "Recording..." : "Log Protocol"}
            </Button>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}
