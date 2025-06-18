import { createFileRoute, Navigate, useNavigate } from '@tanstack/react-router';
import { Chat } from '@web/components/chat/index';
import { Button } from '@web/components/ui/button';
import { useChatMessages } from '@web/hooks/use-chat-messages';
import { useUser } from '@web/hooks/use-user';
import { copySharedChat } from '@web/lib/chats';
import { Copy, Eye, Share2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/_chat/shared/$shareToken')({
  component: SharedChatView,
});

function SharedChatView() {
  const { shareToken } = Route.useParams();
  const { isLoading, parsedMessages, setParsedMessages, chat } =
    useChatMessages(shareToken, 'shareToken');

  if (isLoading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-center'>
          <div className='border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2'></div>
          <p>Loading shared chat...</p>
        </div>
      </div>
    );
  }

  if (!chat) {
    return <Navigate to='/' />;
  }

  return (
    <div className='flex h-screen flex-col'>
      <div className='flex-1 overflow-hidden'>
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
