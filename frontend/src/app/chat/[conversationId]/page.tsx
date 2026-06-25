"use client";

import { useParams } from "next/navigation";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <ChatWindow conversationId={conversationId} />
      </main>
    </div>
  );
}
