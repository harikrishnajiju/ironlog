"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";
import Link from "next/link";
import { auth } from "@/lib/firebase/client";
import { signOut } from "firebase/auth";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (!profile) {
        router.push("/onboarding");
      }
    }
  }, [user, profile, loading, router]);

  if (loading || !user || !profile) {
    return <div className="flex min-h-screen items-center justify-center text-primary font-mono animate-pulse uppercase tracking-widest text-xl">Loading Interface...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col md:pl-64">
        <Topbar />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto mt-16 md:mt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
