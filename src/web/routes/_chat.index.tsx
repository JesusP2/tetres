import { id } from '@instantdb/core';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ChatFooter } from '@web/components/chat/footer';
import { useIsOnline } from '@web/components/providers/is-online';
import { Button } from '@web/components/ui/button';
import { Card } from '@web/components/ui/card';
import { Code, Create, Explore, Learn } from '@web/components/ui/icons';
import { useUI } from '@web/hooks/use-ui';
import { useUser } from '@web/hooks/use-user';
import { handleCreateChat } from '@web/lib/create-chat';
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
  const connection = useIsOnline();

  return (
    <div className='flex h-full flex-col'>
      <div className='mx-auto flex-1 items-center justify-center'>
        {!isNew && (
          <div className='w-full max-w-2xl p-8'>
            <h1 className='mb-4 text-4xl font-bold'>
              How can I help you, {user.data?.name ?? 'you'}?
            </h1>
            <div className='mb-8 flex space-x-2 sm:space-x-4'>
              <Button
                variant='outline'
                className='h-14 flex-1 flex-col gap-y-1 sm:h-auto sm:flex-row'
              >
                <Create className='mb-1 sm:mr-2 sm:mb-0' />
                <span className='text-xs sm:text-sm'>Create</span>
              </Button>
              <Button
                variant='outline'
                className='h-14 flex-1 flex-col gap-y-1 sm:h-auto sm:flex-row'
              >
                <Explore className='mb-1 sm:mr-2 sm:mb-0' />
                <span className='text-xs sm:text-sm'>Explore</span>
              </Button>
              <Button
                variant='outline'
                className='h-14 flex-1 flex-col gap-y-1 sm:h-auto sm:flex-row'
              >
                <Code className='mb-1 sm:mr-2 sm:mb-0' />
                <span className='text-xs sm:text-sm'>Code</span>
              </Button>
              <Button
                variant='outline'
                className='h-14 flex-1 flex-col gap-y-1 sm:h-auto sm:flex-row'
              >
                <Learn className='mb-1 sm:mr-2 sm:mb-0' />
                <span className='text-xs sm:text-sm'>Learn</span>
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
      <div className='px-2'>
        <ChatFooter
          userId={user.data ? user.data.id : undefined}
          onSubmit={async (search, files, webSearchEnabled, reasoning) => {
            if (!connection.isOnline && !connection.isChecking) return;
            const newChatId = id();
            await Promise.all([
              handleCreateChat(
                newChatId,
                search,
                files,
                webSearchEnabled,
                reasoning,
                user,
                ui,
              ),
              navigate({
                to: '/$chatId',
                params: { chatId: newChatId },
              })
            ])
          }}
          selectedModel={ui?.defaultModel}
          updateModel={model => updateUI({ defaultModel: model })}
        />
      </div>
    </div>
  );
}
