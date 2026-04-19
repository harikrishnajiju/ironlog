import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { messages, userProfile, recentWorkouts } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    // Build the system instructions
    const systemInstruction = `
      You are the IronLog AI Tactical Trainer. 
      You are blunt, encouraging, evidence-based, and military-style. No fluff, no coddling.
      The operative is named ${userProfile?.displayName || 'Operative'}.
      They are Level ${userProfile?.level || 1} with a ${userProfile?.currentStreak || 0}-day streak.
      Their primary objective is to ${userProfile?.goal || 'improve'}.
      Recent workouts: ${JSON.stringify(recentWorkouts?.slice(0, 5) || [])}
      Give specific, actionable advice based on their data. 
      Keep responses under 3 short paragraphs.
      Never provide medical advice; always tell them to consult a professional for injuries.
    `;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: systemInstruction 
    });

    // Format messages for Gemini API
    // Gemini expects { role: "user" | "model", parts: [{ text: "..." }] }
    const history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));
    
    const lastMessage = messages[messages.length - 1].content;

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage);
    const responseText = result.response.text();

    return NextResponse.json({ text: responseText });
    
  } catch (error: any) {
    console.error("Trainer API error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate response" }, { status: 500 });
  }
}
