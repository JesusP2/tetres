import { useNavigate } from '@tanstack/react-router';
import { useUser } from '@web/hooks/use-user';
import { db } from '@web/lib/instant';
import type { Chat, Project } from '@web/lib/types';
import { PlusIcon, SearchIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { groupBy, partition, pipe } from 'remeda';
import { ProjectList } from '../project-list';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ChatList } from './chat-list';
import { ChatSearch } from './chat-search';
import { useIsOnline } from '../providers/is-online';

const groupChats = (chats: Chat[]) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return pipe(
    chats,
    groupBy((chat: Chat) => {
      const updatedAt = new Date(chat.updatedAt);
      if (updatedAt >= today) {
        return 'Today';
      } else if (updatedAt >= yesterday) {
        return 'Yesterday';
      } else if (updatedAt >= sevenDaysAgo) {
        return 'Last 7 days';
      } else if (updatedAt >= thirtyDaysAgo) {
        return 'Last 30 days';
      } else {
        return 'Older';
      }
    }),
  );
};

export function Content({
  searchDialogOpen,
  setSearchDialogOpen,
}: {
  searchDialogOpen: boolean;
  setSearchDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const user = useUser();
  const connection = useIsOnline();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { data } = db.useQuery(
    !user.isPending && user.data
      ? {
          chats: {
            $: {
              where: {
                userId: user.data.id || '',
              },
              order: {
                updatedAt: 'desc',
              },
            },
          },
          projects: {
            $: {
              where: {
                userId: user.data.id || '',
              },
              order: {
                updatedAt: 'asc',
              },
            },
          },
        }
      : null,
  );
  const chats = (data?.chats || []) as Chat[];
  const projects = (data?.projects || []) as Project[];

  const orphanedChats = chats.filter(chat => !chat.projectId);

  const filteredChats = searchQuery
    ? orphanedChats.filter(chat =>
        chat.title.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : orphanedChats;
  const [pinned, unpinned] = partition(filteredChats, c => c.pinned);
  const groupedChats = groupChats(unpinned);

  const handleNewChat = () => {
    if (!user.isPending) {
      navigate({ to: '/', search: { new: true } });
    }
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchDialogOpen(open => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);
  return (
    <>
      <div className='flex flex-col gap-4 p-4 py-1'>
        <Button onClick={handleNewChat} disabled={!connection.isOnline && !connection.isChecking}>
          <PlusIcon className='mr-2' /> New Chat
        </Button>
        <div className='relative'>
          <SearchIcon className='text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2' />
          <Input
            placeholder='Search your threads...'
            className='pl-8'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <ChatSearch
        isOpen={searchDialogOpen}
        setIsOpen={setSearchDialogOpen}
        chats={chats}
        user={user}
      />
      <ProjectList allChats={chats} />
      <ChatList
        projects={projects}
        allChats={chats}
        pinned={pinned}
        groupedChats={groupedChats}
      />
    </>
  );
}
