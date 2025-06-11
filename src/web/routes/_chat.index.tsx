import { id } from '@instantdb/react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ChatFooter } from '@web/components/chat/footer';
import { Button } from '@web/components/ui/button';
import { Card } from '@web/components/ui/card';
import { Code, Create, Explore, Learn } from '@web/components/ui/icons';
import { createChat } from '@web/lib/chats';
import { saveMessage, sendMessage } from '@web/lib/messages';
import { useState } from 'react';
import { z } from 'zod';
import type { ModelId } from '@server/utils/models';
import { useUser } from '@web/hooks/use-user';

const indexSearchSchema = z.object({
  new: z.boolean().optional(),
});

export const Route = createFileRoute('/_chat/')({
  validateSearch: search => indexSearchSchema.parse(search),
  component: Index,
});

const suggestions = [
  'How does AI work?',
  'Are black holes real?',
  'How many Rs are in the word "strawberry"?',
  'What is the meaning of life?',
];

const defaultModelForUser = 'google/gemini-2.5-flash-preview-05-20';
function Index() {
  const { new: isNew } = Route.useSearch();
  const navigate = useNavigate();
  const user = useUser();
  // TODO: persist this in the database
  const [defaultModel, setDefaultModel] =
    useState<ModelId>(defaultModelForUser);

  const handleCreateChat = async (message: string) => {
    if (user.isPending) return;
    const newChatId = id();
    await createChat(
      { id: user.data.id },
      'New Chat',
      newChatId,
    );
    await new Promise(resolve => setTimeout(resolve, 1000));
    await saveMessage(
      {
        chatId: newChatId,
        role: 'user',
        content: message,
        model: defaultModel,
      },
      id(),
      [],
    );
    await sendMessage(
      [
        {
          chatId: newChatId,
          role: 'assistant',
          content: 'Hello! How can I help you today?',
          model: defaultModel,
        },
      ],
      user.data.id,
    );
    navigate({
      to: '/$chatId',
      params: { chatId: newChatId },
    });
  };

  return (
    <div className='flex h-full flex-col'>
      <div className='mx-auto flex-1 items-center justify-center'>
        {!isNew && (
          <div className='w-full max-w-2xl p-8'>
            <h1 className='mb-4 text-4xl font-bold'>
              How can I help you, Jesus?
            </h1>
            <div className='mb-8 flex space-x-4'>
              <Button variant='outline'>
                <Create className='mr-2' /> Create
              </Button>
              <Button variant='outline'>
                <Explore className='mr-2' /> Explore
              </Button>
              <Button variant='outline'>
                <Code className='mr-2' /> Code
              </Button>
              <Button variant='outline'>
                <Learn className='mr-2' /> Learn
              </Button>
            </div>
            <div className='space-y-4'>
              {suggestions.map(s => (
                <Card
                  key={s}
                  className='hover:bg-muted cursor-pointer p-4 transition-colors'
                >
                  {s}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
      <ChatFooter
        userId={!user.isPending ? user.data.id : undefined}
        onSubmit={handleCreateChat}
        selectedModel={defaultModelForUser}
        setSelectedModel={model => {
          setDefaultModel(model);
          console.log('set default model for user:', model);
        }}
      />
    </div>
  );
}
