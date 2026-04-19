"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import { signOut } from "firebase/auth";
import { Home, Dumbbell, History, User, LogOut, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Log Protocol", href: "/log", icon: Dumbbell },
  { name: "Tactical AI", href: "/trainer", icon: Brain },
  { name: "History", href: "/history", icon: History },
  { name: "Parameters", href: "/profile", icon: User },
];

export function Sidebar() {
  const pathname = usePathname();

  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card fixed inset-y-0 z-50">
      <div className="p-6 border-b border-border">
        <h1 className="text-3xl font-mono text-primary font-bold tracking-tighter uppercase">IronLog</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg font-mono uppercase text-sm transition-all duration-200",
                isActive 
                  ? "bg-primary text-primary-foreground font-bold shadow-[0_0_10px_rgba(204,255,0,0.3)]" 
                  : "text-muted-foreground hover:bg-secondary hover:text-white"
              )}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <button 
          onClick={handleSignOut} 
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors font-mono uppercase text-sm"
        >
          <LogOut className="w-5 h-5" />
          Abort Mission
        </button>
      </div>
    </aside>
  );
}
