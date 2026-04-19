"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuthStore } from "@/lib/store/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserProfile } from "@/types";
import { Timestamp } from "firebase/firestore";

const onboardingSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  age: z.coerce.number().min(10, "Must be at least 10").max(120, "Must be under 120"),
  sex: z.enum(["male", "female", "other"]),
  heightCm: z.coerce.number().min(50, "Minimum 50cm").max(300, "Maximum 300cm"),
  weightKg: z.coerce.number().min(20, "Minimum 20kg").max(500, "Maximum 500kg"),
  goal: z.enum(["cut", "maintain", "bulk"]),
  experience: z.enum(["beginner", "intermediate", "advanced"]),
  modality: z.enum(["gym", "home", "both"]),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const [error, setError] = useState<string | null>(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const { user, profile, loading } = useAuthStore();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      age: 25,
      sex: "male",
      heightCm: 175,
      weightKg: 70,
      goal: "maintain",
      experience: "intermediate",
      modality: "gym",
    }
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
    if (!loading && profile) {
      // If profile already exists, redirect to dashboard
      router.push("/dashboard");
    }
  }, [user, profile, loading, router]);

  const onSubmit = async (data: OnboardingFormValues) => {
    if (!user) return;
    setLoadingSubmit(true);
    setError(null);
    try {
      const now = Timestamp.now();
      const newProfile: Omit<UserProfile, "uid"> = {
        email: user.email,
        displayName: data.displayName,
        photoURL: user.photoURL,
        age: data.age,
        sex: data.sex,
        heightCm: data.heightCm,
        weightKg: data.weightKg,
        goal: data.goal,
        experience: data.experience,
        modality: data.modality,
        level: 1,
        xp: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastWorkoutDate: null,
        achievements: [],
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, "users", user.uid), newProfile);
      // AuthStore will automatically fetch the profile since it listens to onAuthStateChanged, 
      // but wait, onAuthStateChanged only fires on Auth state changes, not Firestore document changes.
      // We should manually update the Zustand store or force a re-fetch. Actually, a reload or just relying on a profile listener would be better.
      // For now, redirecting to dashboard will remount or we can just reload.
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message || "Failed to save profile");
      setLoadingSubmit(false);
    }
  };

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-primary font-mono animate-pulse">Loading...</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 py-12 bg-background">
      <Card className="w-full max-w-xl bg-card border-border shadow-2xl rounded-2xl">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-4xl font-mono tracking-tighter text-primary uppercase">IronLog</CardTitle>
          <CardDescription className="text-muted-foreground text-sm uppercase tracking-widest">
            Initial Calibration Protocol
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input id="displayName" {...register("displayName")} className="bg-input border-border focus-visible:ring-primary" />
                {errors.displayName && <p className="text-destructive text-sm">{errors.displayName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input id="age" type="number" {...register("age", { valueAsNumber: true })} className="bg-input border-border focus-visible:ring-primary" />
                {errors.age && <p className="text-destructive text-sm">{errors.age.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sex">Sex</Label>
                <select 
                  id="sex" 
                  {...register("sex")} 
                  className="flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.sex && <p className="text-destructive text-sm">{errors.sex.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="heightCm">Height (cm)</Label>
                <Input id="heightCm" type="number" {...register("heightCm", { valueAsNumber: true })} className="bg-input border-border focus-visible:ring-primary" />
                {errors.heightCm && <p className="text-destructive text-sm">{errors.heightCm.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="weightKg">Weight (kg)</Label>
                <Input id="weightKg" type="number" step="0.1" {...register("weightKg", { valueAsNumber: true })} className="bg-input border-border focus-visible:ring-primary" />
                {errors.weightKg && <p className="text-destructive text-sm">{errors.weightKg.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="goal">Primary Goal</Label>
                <select 
                  id="goal" 
                  {...register("goal")} 
                  className="flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="cut">Cut</option>
                  <option value="maintain">Maintain</option>
                  <option value="bulk">Bulk</option>
                </select>
                {errors.goal && <p className="text-destructive text-sm">{errors.goal.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Experience Level</Label>
                <select 
                  id="experience" 
                  {...register("experience")} 
                  className="flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                {errors.experience && <p className="text-destructive text-sm">{errors.experience.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="modality">Modality</Label>
                <select 
                  id="modality" 
                  {...register("modality")} 
                  className="flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="gym">Gym</option>
                  <option value="home">Home</option>
                  <option value="both">Both</option>
                </select>
                {errors.modality && <p className="text-destructive text-sm">{errors.modality.message}</p>}
              </div>
            </div>

            {error && <p className="text-destructive text-sm font-semibold text-center">{error}</p>}
            
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-wider" disabled={loadingSubmit}>
              {loadingSubmit ? "Saving Parameters..." : "Initialize Protocol"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
