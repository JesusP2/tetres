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

function objectToString(obj: any): string {
  if (typeof obj === 'string') {
    return obj;
  }
  if (obj && typeof obj === 'object') {
    return Object.values(obj).join('');
  }
  return '';
}

export function Chat({ chat, messages = [], onSubmit }: ChatProps) {
  const sortedMessages = sortBy(messages, (m: Message) => m.createdAt);
  const session = authClient.useSession();

  const handleNewMessage = async (message: string) => {
    if (onSubmit) {
      onSubmit(message);
      return;
    }
    const userId = session.data?.session?.userId;
    if (chat && userId) {
      await saveMessage(
        [
          ...sortedMessages.map((m) => ({
            chatId: chat.id,
            role: m.role as any,
            content: objectToString(m.content),
          })),
          {
            chatId: chat.id,
            role: 'user' as const,
            content: message,
          }
        ],
        userId
      );
    }
  };
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {sortedMessages.map((m) => {
            const content = objectToString(m.content);
            return m.role === 'user' ? (
              <div key={m.id} className="flex justify-end">
                <div className="p-2 rounded-lg max-w-xs md:max-w-md bg-primary text-primary-foreground">
                  {content}
                </div>
              </div>
            ) : (
              <div key={m.id} className="w-full prose">
                {content}
              </div>
            );
          })}
        </div>

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
