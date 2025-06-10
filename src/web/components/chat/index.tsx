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
          ...messages.map((m) => ({
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
        userId
      );
    }
  };
  return (
    <>
      <div className="flex flex-col h-full">
        <div className="h-screen chat-scrollbar overflow-y-auto pb-40">
          <div className="space-y-4 max-w-3xl mx-auto px-4">
            {messages.map((m) => {
              const content = m.content
              return m.role === 'user' ? (
                <div key={m.id} className="flex justify-end">
                  <div className="p-2 rounded-lg max-w-xs md:max-w-md bg-primary text-primary-foreground">
                    {content}
                  </div>
                </div>
              ) : (
                  <div key={m.id} dangerouslySetInnerHTML={{ __html: content }} />
              );
            })}
          </div>
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Send a message to start the conversation.
            </div>
          )}
        </div>
      </div>
      <ChatFooter onSubmit={handleNewMessage} />
    </>
  );
} 
