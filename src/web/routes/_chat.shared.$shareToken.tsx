import { createFileRoute, Navigate, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@web/components/ui/button';
import { useUser } from '@web/hooks/use-user';
import { copySharedChat } from '@web/lib/chats';
import { Chat } from '@web/components/chat/index';
import { Copy, Eye, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useChatMessages } from '@web/hooks/use-chat-messages';

export const Route = createFileRoute('/_chat/shared/$shareToken')({
  component: SharedChatView,
});

function SharedChatView() {
  const { shareToken } = Route.useParams();
  const { isLoading, parsedMessages, setParsedMessages, chat } =
    useChatMessages(shareToken, 'shareToken');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading shared chat...</p>
        </div>
      </div>
    );
  }

  if (!chat) {
    return <Navigate to="/" />;
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 overflow-hidden">
        <Chat
          chat={chat}
          messages={parsedMessages}
          setParsedMessages={setParsedMessages}
          onSubmit={() => {}}
        />
      </div>
    </div>
  );
} 
