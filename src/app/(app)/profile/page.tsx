"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase/client";
import { updateProfile } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const profileSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  age: z.coerce.number().min(10, "Minimum age is 10").max(120, "Maximum age is 120"),
  heightCm: z.coerce.number().min(50, "Minimum 50cm").max(300, "Maximum 300cm"),
  weightKg: z.coerce.number().min(20, "Minimum 20kg").max(500, "Maximum 500kg"),
  goal: z.enum(["cut", "maintain", "bulk"]),
  experience: z.enum(["beginner", "intermediate", "advanced"]),
  modality: z.enum(["gym", "home", "both"]),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, profile, setProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: "success" | "error" } | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: profile?.displayName || "",
      age: profile?.age || 25,
      heightCm: profile?.heightCm || 175,
      weightKg: profile?.weightKg || 70,
      goal: (profile?.goal as any) || "maintain",
      experience: (profile?.experience as any) || "intermediate",
      modality: (profile?.modality as any) || "gym",
    }
  });

  if (!user || !profile) return null;

  const onSubmit = async (data: ProfileFormValues) => {
    setLoading(true);
    setMessage(null);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        displayName: data.displayName,
        age: data.age,
        heightCm: data.heightCm,
        weightKg: data.weightKg,
        goal: data.goal,
        experience: data.experience,
        modality: data.modality,
        updatedAt: new Date(),
      });
      
      // Update local state
      setProfile({
        ...profile,
        ...data,
      });

      setMessage({ text: "Profile updated successfully.", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to update profile.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarLoading(true);
    setMessage(null);
    try {
      const storageRef = ref(storage, `avatars/${user.uid}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      // Update auth profile
      await updateProfile(user, { photoURL });
      
      // Update firestore
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { photoURL });

      // Update local state
      setProfile({ ...profile, photoURL });

      setMessage({ text: "Avatar updated successfully.", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to upload avatar.", type: "error" });
    } finally {
      setAvatarLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-mono font-bold uppercase tracking-tighter text-primary">Operative Profile</h2>
        <p className="text-muted-foreground text-sm uppercase tracking-widest mt-1">Manage your parameters</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Avatar and Stats */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="bg-card border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-mono uppercase text-primary">Identity</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-primary bg-secondary flex items-center justify-center">
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-mono text-muted-foreground">{profile.displayName?.charAt(0) || "X"}</span>
                )}
              </div>
              <div className="w-full">
                <Label htmlFor="avatar" className="cursor-pointer block text-center text-xs uppercase bg-secondary text-secondary-foreground py-2 rounded border border-border hover:bg-accent hover:text-accent-foreground transition-colors">
                  {avatarLoading ? "Uploading..." : "Upload New Avatar"}
                </Label>
                <input id="avatar" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={avatarLoading} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-mono uppercase text-primary">Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 font-mono">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground uppercase text-xs">Level</span>
                  <span className="text-xl font-bold text-white">{profile.level}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground uppercase text-xs">Experience Points</span>
                  <span className="text-xl font-bold text-accent">{profile.xp}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground uppercase text-xs">Current Streak</span>
                  <span className="text-xl font-bold text-primary">{profile.currentStreak} 🔥</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground uppercase text-xs">Longest Streak</span>
                  <span className="text-xl font-bold text-white">{profile.longestStreak}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Edit Profile Form */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-mono uppercase text-primary">Parameters</CardTitle>
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
                    <Input id="age" type="number" {...register("age")} className="bg-input border-border focus-visible:ring-primary" />
                    {errors.age && <p className="text-destructive text-sm">{errors.age.message}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="heightCm">Height (cm)</Label>
                    <Input id="heightCm" type="number" {...register("heightCm")} className="bg-input border-border focus-visible:ring-primary" />
                    {errors.heightCm && <p className="text-destructive text-sm">{errors.heightCm.message}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="weightKg">Weight (kg)</Label>
                    <Input id="weightKg" type="number" step="0.1" {...register("weightKg")} className="bg-input border-border focus-visible:ring-primary" />
                    {errors.weightKg && <p className="text-destructive text-sm">{errors.weightKg.message}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="goal">Primary Goal</Label>
                    <select 
                      id="goal" 
                      {...register("goal")} 
                      className="flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      <option value="cut">Cut</option>
                      <option value="maintain">Maintain</option>
                      <option value="bulk">Bulk</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience">Experience Level</Label>
                    <select 
                      id="experience" 
                      {...register("experience")} 
                      className="flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="modality">Modality</Label>
                    <select 
                      id="modality" 
                      {...register("modality")} 
                      className="flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      <option value="gym">Gym</option>
                      <option value="home">Home</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                </div>

                {message && (
                  <p className={`text-sm font-semibold text-center ${message.type === 'success' ? 'text-primary' : 'text-destructive'}`}>
                    {message.text}
                  </p>
                )}
                
                <Button type="submit" className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-wider" disabled={loading}>
                  {loading ? "Updating..." : "Save Parameters"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
