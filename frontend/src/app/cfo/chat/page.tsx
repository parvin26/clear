"use client";

import { useEffect, useRef, useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { postCfoChat } from "@/lib/api";
import type { CFOChatResponse } from "@/lib/types";
import { Loader2, MessageCircle, Send } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

export default function CFOChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingMessage, setPendingMessage] = useState("");
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedSession = typeof window !== "undefined" ? localStorage.getItem("aiCfoChatSession") : null;
    if (storedSession) {
      setSessionId(storedSession);
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleSend = async () => {
    if (!pendingMessage.trim()) {
      return;
    }
    setError(null);
    const messageText = pendingMessage.trim();

    const tempId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        sender: "user",
        text: messageText,
        timestamp: new Date().toISOString(),
      },
    ]);
    setPendingMessage("");
    setLoading(true);

    try {
      const payload = {
        message: messageText,
        session_id: sessionId,
      };
      const response: CFOChatResponse = await postCfoChat(payload);
      setSessionId(response.session_id);
      if (typeof window !== "undefined") {
        localStorage.setItem("aiCfoChatSession", response.session_id);
      }
      setMessages((prev) => [
        ...prev,
        {
          id: response.session_id + response.created_at,
          sender: "ai",
          text: response.ai_response,
          timestamp: response.created_at,
        },
      ]);
    } catch (err) {
      setError("Failed to send message. Please try again.");
      console.error("Chat error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Shell>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Finance Chat</h1>
            <p className="text-gray-600 mt-1">
              Get instant financial insights and guidance tailored for SMEs in South-East Asia
            </p>
          </div>
        </div>

        <Card className="border shadow-sm">
          <CardHeader className="border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Conversation</CardTitle>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {sessionId ? `Session: ${sessionId.slice(0, 8)}...` : "Starting new conversation"}
                  </p>
                </div>
              </div>
              {messages.length > 0 && (
                <div className="text-xs text-gray-500">
                  {messages.length} message{messages.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div
              ref={scrollRef}
              className="h-[500px] overflow-y-auto bg-gray-50 p-6 space-y-4"
            >
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
                    <MessageCircle className="w-10 h-10 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Start a conversation</h3>
                  <p className="text-sm text-gray-600 max-w-md">
                    Ask anything about your finances. Get insights on cash flow, risk management, 
                    fundraising, and more.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2 justify-center">
                    {["Cash flow tips", "Risk assessment", "Fundraising advice", "KPI guidance"].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setPendingMessage(suggestion)}
                        className="px-4 py-2 text-xs rounded-full bg-white border border-gray-200 hover:border-blue-500 hover:text-blue-600 transition-colors shadow-sm"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`rounded-lg px-4 py-3 max-w-[75%] ${
                      message.sender === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-200 shadow-sm"
                    }`}
                  >
                    <p className={`text-sm ${message.sender === "user" ? "text-white" : "text-gray-900"}`}>
                      {message.text}
                    </p>
                    <p className={`text-xs mt-2 ${
                      message.sender === "user" ? "text-white/70" : "text-gray-500"
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-5 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span className="text-sm text-gray-600">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="p-6 border-t bg-white">
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <Textarea
                    value={pendingMessage}
                    onChange={(e) => setPendingMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about cash flow, fundraising readiness, KPI signals, risk management..."
                    rows={3}
                    disabled={loading}
                    className="resize-none"
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                    Press Enter to send, Shift+Enter for new line
                  </div>
                </div>
                <Button 
                  onClick={handleSend} 
                  disabled={loading || !pendingMessage.trim()}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
