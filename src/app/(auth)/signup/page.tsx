"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const signupSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    setLoading(true);
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, data.email, data.password);
      // Wait, Onboarding profile setup will happen next!
      router.push("/onboarding");
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Check if profile exists, but for simplicity let's route to onboarding, onboarding can skip if profile exists.
      router.push("/onboarding");
    } catch (err: any) {
      setError(err.message || "Failed to sign up with Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <Card className="w-full max-w-md bg-card border-border shadow-2xl rounded-2xl">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-4xl font-mono tracking-tighter text-primary uppercase">IronLog</CardTitle>
          <CardDescription className="text-muted-foreground text-sm uppercase tracking-widest">
            New Recruit Registration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="athlete@example.com"
                {...register("email")}
                className="bg-input border-border focus-visible:ring-primary"
              />
              {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                className="bg-input border-border focus-visible:ring-primary"
              />
              {errors.password && <p className="text-destructive text-sm">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register("confirmPassword")}
                className="bg-input border-border focus-visible:ring-primary"
              />
              {errors.confirmPassword && <p className="text-destructive text-sm">{errors.confirmPassword.message}</p>}
            </div>
            {error && <p className="text-destructive text-sm font-semibold">{error}</p>}
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-wider" disabled={loading}>
              {loading ? "Registering..." : "Join the Ranks"}
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or enlist with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full border-border text-foreground hover:bg-accent hover:text-accent-foreground font-mono uppercase"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              Google
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          Already enlisted?{" "}
          <Link href="/login" className="ml-2 text-primary hover:underline uppercase font-bold">
            Log In
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
