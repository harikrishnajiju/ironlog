"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Award } from "lucide-react";
import { useEffect } from "react";

interface AchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievement: {
    id: string;
    name: string;
    description: string;
    icon: string;
  } | null;
}

export function AchievementModal({ isOpen, onClose, achievement }: AchievementModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Auto close after 5 seconds
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && achievement && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.8, y: 50, rotate: -5 }}
            animate={{ scale: 1, y: 0, rotate: 0 }}
            exit={{ scale: 0.8, y: 50, opacity: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            className="bg-card border-2 border-primary shadow-[0_0_50px_rgba(204,255,0,0.2)] rounded-2xl p-8 max-w-sm w-full relative overflow-hidden"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="absolute -top-12 -left-12 opacity-10">
              <Award className="w-48 h-48 text-primary" />
            </div>

            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
              <div className="text-6xl animate-bounce">
                {achievement.icon}
              </div>
              <h3 className="text-primary font-mono text-sm tracking-widest uppercase font-bold">Achievement Unlocked</h3>
              <h2 className="text-3xl font-mono text-white font-bold tracking-tighter uppercase">{achievement.name}</h2>
              <p className="text-muted-foreground font-mono text-sm">{achievement.description}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
