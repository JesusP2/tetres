import { ChatFooter } from './footer';
import type { Chat as ChatType, Message } from '@web/lib/types';
import { sortBy } from 'remeda';
import { createMessage } from '@web/lib/messages';

type ChatProps = {
  chat?: ChatType;
  messages?: Message[];
  onSubmit?: (message: string) => void;
};

export function Chat({ chat, messages = [], onSubmit }: ChatProps) {
  const sortedMessages = sortBy(messages, (m: Message) => m.createdAt);

  const handleNewMessage = async (message: string) => {
    if (onSubmit) {
      onSubmit(message);
      return;
    }
    if (chat) {
      await createMessage({
        chatId: chat.id,
        role: 'user',
        content: message,
      });
      // Mocked bot response
      setTimeout(
        () =>
          createMessage({
            chatId: chat.id,
            role: 'assistant',
            content: 'This is a mocked response.',
          }),
        1000
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
