"use client";

import { useEffect, useRef, useState } from "react";
import { Send, MessageSquare } from "lucide-react";

import { sendChatMessage, getChatHistory } from "@/lib/api";
import type { ChatMessage } from "@/lib/types-coo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChatInterfaceProps {
  analysisId?: number | null;
  initialSessionId?: string | null;
}

export function ChatInterface({ analysisId, initialSessionId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialSessionId) {
      loadHistory(initialSessionId);
    }
  }, [initialSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadHistory = async (sid: string) => {
    try {
      const history = await getChatHistory(sid);
      setMessages(history);
      setSessionId(sid);
    } catch (err) {
      console.error("Failed to load chat history:", err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString(),
      analysis_id: analysisId || null,
    };

    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await sendChatMessage(userMessage, analysisId, sessionId);
      setSessionId(response.session_id);
      setMessages((prev) => [...prev, response.message]);
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          created_at: new Date().toISOString(),
          analysis_id: analysisId || null,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex h-[600px] flex-col border-0 shadow-premium overflow-hidden">
      <div className="h-1 bg-gradient-premium"></div>
      <CardHeader className="bg-gradient-premium-soft">
        <CardTitle className="text-2xl flex items-center gap-3">
          <div className="rounded-lg bg-gradient-premium p-2 text-white shadow-glow">
            <MessageSquare className="h-5 w-5" />
          </div>
          Chat with AI-COO
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Ask questions about your operations, get advice, and explore solutions.
        </p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden p-6">
        <div className="flex-1 space-y-4 overflow-y-auto rounded-xl border bg-muted/30 p-4 backdrop-blur-sm">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-muted-foreground">
              <div>
                <p className="font-medium">Start a conversation with AI-COO</p>
                <p className="text-sm">Ask about operational challenges, best practices, or get advice.</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className="mt-1 text-xs opacity-70">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-muted px-4 py-2">
                <p className="text-sm">AI-COO is thinking...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message..."
            disabled={loading}
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

