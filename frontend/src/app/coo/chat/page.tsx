"use client";

import { Shell } from "@/components/layout/Shell";
import { ChatInterface } from "@/components/coo/ChatInterface";

export default function COOChatPage() {
  return (
    <Shell>
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Ops Chat</h1>
          <p className="mt-2 text-gray-600">
            Get personalized operational advice and answers to your questions.
          </p>
        </div>
        <ChatInterface />
      </div>
    </Shell>
  );
}

