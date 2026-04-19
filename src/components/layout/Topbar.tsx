"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";
import { auth } from "@/lib/firebase/client";
import { signOut } from "firebase/auth";
import { Home, Dumbbell, History, User, LogOut, Menu, X, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRoleForLevel } from "@/lib/xp";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Log Protocol", href: "/log", icon: Dumbbell },
  { name: "Tactical AI", href: "/trainer", icon: Brain },
  { name: "History", href: "/history", icon: History },
  { name: "Parameters", href: "/profile", icon: User },
];

export function Topbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { profile } = useAuthStore();

  const handleSignOut = () => {
    signOut(auth);
  };

  const currentLevel = profile?.level || 1;
  const role = getRoleForLevel(currentLevel);
  // Calculate progress to next level (simple 50 XP per level approx)
  const currentXP = profile?.xp || 0;
  // xp needed for current level = (currentLevel - 1)^2 * 50
  const xpCurrentLevel = Math.pow(currentLevel - 1, 2) * 50;
  const xpNextLevel = Math.pow(currentLevel, 2) * 50;
  const xpProgress = currentXP - xpCurrentLevel;
  const xpRequired = xpNextLevel - xpCurrentLevel;
  const progressPercent = Math.min(100, Math.max(0, (xpProgress / xpRequired) * 100));

  return (
    <>
      <header className="md:hidden flex items-center justify-between h-16 px-4 border-b border-border bg-card fixed top-0 inset-x-0 z-50">
        <h1 className="text-xl font-mono text-primary font-bold tracking-tighter uppercase">IronLog</h1>
        
        <div className="flex items-center gap-4">
          {profile && (
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-mono uppercase text-muted-foreground">{role} - LVL {currentLevel}</span>
              <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden mt-1">
                <div className="h-full bg-primary" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          )}
          <button onClick={() => setIsOpen(!isOpen)} className="text-foreground p-2">
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Desktop Top Bar (Only for showing Level / XP, Sidebar handles nav) */}
      <div className="hidden md:flex h-16 border-b border-border bg-background items-center justify-end px-8 sticky top-0 z-40">
        {profile && (
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-mono uppercase text-muted-foreground font-bold">{role} <span className="text-primary">LVL {currentLevel}</span></span>
              <div className="w-48 h-2 bg-secondary rounded-full overflow-hidden mt-1 relative border border-border">
                <div className="absolute inset-y-0 left-0 bg-primary shadow-[0_0_8px_rgba(204,255,0,0.8)]" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden bg-secondary flex items-center justify-center">
              {profile.photoURL ? (
                <img src={profile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40 bg-background flex flex-col p-4 border-t border-border">
          {profile && (
            <div className="sm:hidden flex flex-col items-center mb-8 p-4 bg-card rounded-lg border border-border">
              <div className="w-16 h-16 rounded-full border-2 border-primary overflow-hidden bg-secondary flex items-center justify-center mb-2">
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <span className="text-sm font-mono uppercase text-white font-bold">{profile.displayName}</span>
              <span className="text-xs font-mono uppercase text-muted-foreground">{role} - LVL {currentLevel}</span>
              <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mt-2">
                <div className="h-full bg-primary" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          )}

          <nav className="flex-1 space-y-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-4 px-4 py-4 rounded-lg font-mono uppercase text-sm transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground font-bold" 
                      : "text-muted-foreground hover:bg-secondary hover:text-white"
                  )}
                >
                  <Icon className="w-6 h-6" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          
          <button 
            onClick={() => {
              setIsOpen(false);
              handleSignOut();
            }} 
            className="flex items-center gap-4 w-full px-4 py-4 rounded-lg text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors font-mono uppercase text-sm mt-auto"
          >
            <LogOut className="w-6 h-6" />
            Abort Mission
          </button>
        </div>
      )}
    </>
  );
}
