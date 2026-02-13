"use client";

import { Shell } from "@/components/layout/Shell";
import { ChatInterface } from "@/components/cto/ChatInterface";

export default function CTOChatPage() {
  return (
    <Shell>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tech Chat</h1>
          <p className="mt-2 text-gray-600">
            Get technology strategy advice and answers to your questions.
          </p>
        </div>
        <ChatInterface />
      </div>
    </Shell>
  );
}
