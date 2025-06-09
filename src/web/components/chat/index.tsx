import { ChatFooter } from './footer';
import type { Chat as ChatType, Message } from '@web/lib/types';
import { sortBy } from 'remeda';
import { saveMessage } from '@web/lib/messages';
import { authClient } from '@web/lib/auth-client';

type ChatProps = {
  chat?: ChatType;
  messages?: Message[];
  onSubmit?: (message: string) => void;
};

export function Chat({ chat, messages = [], onSubmit }: ChatProps) {
  const sortedMessages = sortBy(messages, (m: Message) => m.createdAt);
  const session = authClient.useSession();

  const handleNewMessage = async (message: string) => {
    if (onSubmit) {
      onSubmit(message);
      return;
    }
    if (chat) {
      await saveMessage(
        [
          ...sortedMessages.map((m) => ({
            chatId: chat.id,
            role: m.role as any,
            content: m.content,
          })),
          {
            chatId: chat.id,
            role: 'user' as const,
            content: message,
          }
        ],
        session.data?.session?.userId
      );
    }
  };
  return (
    <div className='flex flex-col h-full'>
      <div className='flex-grow p-4'>
        {sortedMessages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
          >
            <div
              className={`p-2 rounded-lg max-w-xs md:max-w-md ${m.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
                }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Send a message to start the conversation.
          </div>
        )}
      </div>
      <ChatFooter onSubmit={handleNewMessage} />
    </div>
  );
} 
