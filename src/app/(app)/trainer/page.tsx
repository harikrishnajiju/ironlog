"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/store/auth";
import { db } from "@/lib/firebase/client";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Send, User } from "lucide-react";

type Message = {
  role: "user" | "trainer";
  content: string;
};

export default function TrainerPage() {
  const { user, profile } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([
    { role: "trainer", content: "Tactical AI initialized. What are your parameters for today's mission, operative?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetchWorkouts = async () => {
      const q = query(collection(db, "users", user.uid, "workouts"), orderBy("date", "desc"), limit(5));
      const snapshot = await getDocs(q);
      setRecentWorkouts(snapshot.docs.map(d => d.data()));
    };
    fetchWorkouts();
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/trainer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          userProfile: profile,
          recentWorkouts
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setMessages([...newMessages, { role: "trainer", content: data.text }]);
    } catch (err) {
      console.error(err);
      setMessages([...newMessages, { role: "trainer", content: "Communication failure. Maintain current protocol and try again." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <div>
        <h2 className="text-3xl font-mono font-bold uppercase tracking-tighter text-primary flex items-center gap-3">
          <Brain className="w-8 h-8" />
          Tactical AI
        </h2>
        <p className="text-muted-foreground text-sm uppercase tracking-widest mt-1">Direct communication channel</p>
      </div>

      <Card className="flex-1 bg-card border-border flex flex-col overflow-hidden shadow-[0_0_20px_rgba(204,255,0,0.05)]">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl p-4 font-mono ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground ml-auto rounded-tr-none' 
                  : 'bg-secondary text-white rounded-tl-none border border-border'
              }`}>
                <div className="flex items-center gap-2 mb-2 opacity-50 text-xs font-bold uppercase tracking-wider">
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
                  {msg.role === 'user' ? profile.displayName : 'Trainer'}
                </div>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-secondary border border-border text-white rounded-xl rounded-tl-none p-4 max-w-[80%] font-mono animate-pulse">
                Analyzing telemetry...
              </div>
            </div>
          )}
        </CardContent>
        <div className="p-4 border-t border-border bg-background">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Request protocol advice..."
              className="bg-input border-border focus-visible:ring-primary font-mono"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !input.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
