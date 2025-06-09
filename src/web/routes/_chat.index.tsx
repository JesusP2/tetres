import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { Chat } from '@web/components/chat/index';
import { Button } from '@web/components/ui/button';
import { Card } from '@web/components/ui/card';
import { Create, Explore, Code, Learn } from '@web/components/ui/icons';
import { createChat } from '@web/lib/chats';
import { useSession } from '@web/lib/auth-client';
import { id } from '@instantdb/react';
import { ChatFooter } from '@web/components/chat/footer';
import { createMessage } from '@web/lib/messages';

const indexSearchSchema = z.object({
  new: z.boolean().optional(),
});

export const Route = createFileRoute('/_chat/')({
  validateSearch: (search) => indexSearchSchema.parse(search),
  component: Index,
});

const suggestions = [
  'How does AI work?',
  'Are black holes real?',
  'How many Rs are in the word "strawberry"?',
  'What is the meaning of life?',
];

function Index() {
  const { new: isNew } = Route.useSearch();
  const navigate = useNavigate();
  const session = useSession();

  const handleCreateChat = async (message: string) => {
    if (session.data?.session) {
      const newChatId = id();
      await createChat({ id: session.data.session.userId }, 'New Chat', newChatId);
      await createMessage({
        chatId: newChatId,
        role: 'user',
        content: message,
      })
      navigate({ to: '/$chatId', params: { chatId: newChatId } });
    }
  };

  if (isNew) {
    return <Chat onSubmit={handleCreateChat} />;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="items-center justify-center mx-auto flex-1">
        <div className="max-w-2xl w-full p-8">
          <h1 className="text-4xl font-bold mb-4">How can I help you, Jesus?</h1>
          <div className="flex space-x-4 mb-8">
            <Button variant="outline">
              <Create className="mr-2" /> Create
            </Button>
            <Button variant="outline">
              <Explore className="mr-2" /> Explore
            </Button>
            <Button variant="outline">
              <Code className="mr-2" /> Code
            </Button>
            <Button variant="outline">
              <Learn className="mr-2" /> Learn
            </Button>
          </div>
          <div className="space-y-4">
            {suggestions.map((s) => (
              <Card
                key={s}
                className="p-4 hover:bg-muted cursor-pointer transition-colors"
              >
                {s}
              </Card>
            ))}
          </div>
        </div>
      </div>
      <ChatFooter onSubmit={handleCreateChat} />
    </div>
  );
} 
