"use client";

import { Shell } from "@/components/layout/Shell";
import { ChatInterface } from "@/components/cmo/ChatInterface";

export default function CMOChatPage() {
  return (
    <Shell>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Growth Chat</h1>
          <p className="text-gray-600 mt-1">
            Get instant answers to your marketing questions
          </p>
        </div>
        <ChatInterface />
      </div>
    </Shell>
  );
}

