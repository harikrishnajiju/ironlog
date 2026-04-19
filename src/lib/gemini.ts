"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { UserProfile } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const generateDailyMotivation = async (profile: UserProfile): Promise<string> => {
  try {
    const prompt = `
      You are an intense, highly aggressive, military-style AI personal trainer for an app called IronLog.
      The user is an operative named "${profile.displayName}".
      Their current goal is to ${profile.goal}. They are level ${profile.level}.
      Give them a short (1-2 sentences max), punchy, highly aggressive motivational quote to get them to work out today.
      No pleasantries. No hashtags. Just pure, brutal motivation.
    `;
    
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("Gemini AI error:", error);
    return "Mission parameters established. Execute protocol. No excuses.";
  }
};

export const generateWorkoutSuggestion = async (profile: UserProfile, recentWorkouts: any[]): Promise<string> => {
  try {
    const recentSummary = recentWorkouts.length > 0 
      ? `Recently they did: ${recentWorkouts.slice(0, 2).map(w => w.type).join(", ")}.`
      : "They haven't logged any workouts recently.";

    const prompt = `
      You are the IronLog AI Trainer. 
      The operative "${profile.displayName}" has a goal to ${profile.goal}.
      ${recentSummary}
      Suggest a short, 1-sentence workout focus for today.
      For example: "Hit a heavy leg day to boost that testosterone." or "Execute 45 minutes of steady-state cardio."
      Keep it strictly to one sentence, assertive tone.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("Gemini AI error:", error);
    return "Execute standard protocol.";
  }
};
