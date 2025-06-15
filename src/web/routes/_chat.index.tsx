import { id } from '@instantdb/react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ChatFooter } from '@web/components/chat/footer';
import { Button } from '@web/components/ui/button';
import { Card } from '@web/components/ui/card';
import { Code, Create, Explore, Learn } from '@web/components/ui/icons';
import { useUI } from '@web/hooks/use-ui';
import { useUser } from '@web/hooks/use-user';
import { createChat } from '@web/lib/chats';
import { handleCreateChat } from '@web/lib/create-chat';
import { db } from '@web/lib/instant';
import { createAssistantMessage, createUserMessage } from '@web/lib/messages';
import {
  createMessageObject,
  fileToIFile,
  messageToAPIMessage,
} from '@web/lib/utils/message';
import { renameChat, sendMessage } from '@web/services';
import type { ClientUploadedFileData } from 'uploadthing/types';
import { z } from 'zod';

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

function Index() {
  const { new: isNew } = Route.useSearch();
  const navigate = useNavigate();
  const user = useUser();
  const { ui, updateUI } = useUI();

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
        userId={user.data ? user.data.id : undefined}
        onSubmit={async (search, files, webSearchEnabled, reasoning) => {
          const newChatId = await handleCreateChat(
            search,
            files,
            webSearchEnabled,
            reasoning,
            user,
            ui,
          );
          if (!newChatId) return;
          await navigate({
            to: '/$chatId',
            params: { chatId: newChatId },
          });
        }}
        selectedModel={ui?.defaultModel}
        updateModel={model => updateUI({ defaultModel: model })}
      />
    </div>
  );
}
