import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from '@web/components/ui/button';
import { Input } from '@web/components/ui/input';
import { ScrollArea } from '@web/components/ui/scroll-area';
import { groupBy, partition, pipe, sortBy } from 'remeda';
import { db } from '@web/lib/instant';
import { type Chat, deleteChat, togglePin, updateChatTitle } from '@web/lib/chats';
import type { MyUser } from '@web/hooks/use-user';
import { useConfirmDialog } from './providers/confirm-dialog-provider';
import { useEffect, useState } from 'react';
import { MessageSquare, Search, Pin, PinOff, Plus, Trash2 } from 'lucide-react';
import {
  SidebarMenu,
  sidebarMenuButtonVariants,
  SidebarMenuItem,
} from '@web/components/ui/sidebar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@web/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@web/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

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
    sortBy([(c: Chat) => c.createdAt, 'desc']),
    groupBy((chat: Chat) => {
      const createdAt = new Date(chat.createdAt);
      if (createdAt >= today) {
        return 'Today';
      } else if (createdAt >= yesterday) {
        return 'Yesterday';
      } else if (createdAt >= sevenDaysAgo) {
        return 'Last 7 days';
      } else if (createdAt >= thirtyDaysAgo) {
        return 'Last 30 days';
      } else {
        return 'Older';
      }
    }),
  );
};

export function ChatList({ user }: { user: MyUser }) {
  const { confirmDelete } = useConfirmDialog();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const { data } = db.useQuery(
    !user.isPending
      ? {
        chats: {
          $: {
            where: {
              userId: user.data.id,
            },
          },
        },
      }
      : {},
  );

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

  const chats = data?.chats || [];
  const filteredChats = searchQuery
    ? chats.filter(chat =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    : chats;

  const [pinned, unpinned] = partition(filteredChats, c => c.pinned);
  const groupedChats = groupChats(unpinned);
  const navigate = useNavigate();

  const handleUpdateTitle = async () => {
    if (!editingChatId) return;
    const chat = chats.find(c => c.id === editingChatId);
    if (chat && editingTitle.trim() && editingTitle.trim() !== chat.title) {
      await updateChatTitle(chat, editingTitle.trim());
    }
    setEditingChatId(null);
    setEditingTitle('');
  };

  const handleDeleteChat = (chat: Chat) => {
    confirmDelete({
      title: 'Delete Chat',
      description: `Are you sure you want to delete "${chat.title}"?`,
      handleConfirm: () => deleteChat(chat),
      handleCancel: () => setEditingChatId(null),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleUpdateTitle();
    } else if (e.key === 'Escape') {
      setEditingChatId(null);
      setEditingTitle('');
    }
  };

  const handleNewChat = () => {
    if (!user.isPending) {
      navigate({ to: '/', search: { new: true } });
    }
  };

  const renderChat = (chat: Chat) => (
    <SidebarMenuItem
      key={chat.id}
      onDoubleClick={() => {
        setEditingChatId(chat.id);
        setEditingTitle(chat.title);
      }}
      className='group'
    >
      {editingChatId === chat.id ? (
        <Input
          value={editingTitle}
          onChange={e => setEditingTitle(e.target.value)}
          onBlur={handleUpdateTitle}
          onKeyDown={handleKeyDown}
          autoFocus
          onFocus={e => e.target.select()}
        />
      ) : (
        <Link
          to='/$chatId'
          params={{ chatId: chat.id }}
          className='w-full'
          activeProps={{
            className: 'bg-accent text-accent-foreground',
          }}
        >
          <div
            className={sidebarMenuButtonVariants({
              className: 'relative w-full justify-start',
            })}
          >
            <MessageSquare className='mr-2' />
            <span className='truncate'>{chat.title}</span>
            <div className='absolute top-0 right-0 flex h-full items-center gap-2'>
              <button
                onClick={e => {
                  e.preventDefault();
                  togglePin(chat);
                }}
              >
                {chat.pinned ? (
                  <PinOff className='h-4 w-4' />
                ) : (
                  <Pin className='h-4 w-4' />
                )}
              </button>
              <button
                onClick={e => {
                  e.preventDefault();
                  handleDeleteChat(chat);
                }}
              >
                <Trash2 className='h-4 w-4' />
              </button>
            </div>
          </div>
        </Link>
      )}
    </SidebarMenuItem>
  );

  return (
    <>
      <div className='flex flex-col gap-4 p-4'>
        <Button onClick={handleNewChat}>
          <Plus className='mr-2' /> New Chat
        </Button>
        <div className='relative'>
          <Search className='text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2' />
          <Input
            placeholder='Search your threads...'
            className='pl-8'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
        <DialogContent className='p-0' showCloseButton={false}>
          <VisuallyHidden>
            <DialogTitle>Search chats</DialogTitle>
          </VisuallyHidden>
          <VisuallyHidden>
            <DialogDescription>
              Search for a chat by its title.
            </DialogDescription>
          </VisuallyHidden>
          <Command>
            <CommandInput placeholder='Search your threads...' />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {chats.map(chat => (
                  <CommandItem
                    key={chat.id}
                    value={chat.title}
                    onSelect={() => {
                      navigate({
                        to: '/$chatId',
                        params: { chatId: chat.id },
                      });
                      setSearchDialogOpen(false);
                    }}
                  >
                    <MessageSquare className='mr-2' />
                    <span>{chat.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
      <ScrollArea className='masked-scroll-area mr-2 h-full overflow-y-auto'>
        <SidebarMenu>
          {pinned.length > 0 && (
            <div className='p-4'>
              <div className='text-muted-foreground mb-2 text-sm font-semibold capitalize'>
                Pinned
              </div>
              {pinned.map(renderChat)}
            </div>
          )}
          {Object.entries(groupedChats).map(([period, chats]) => (
            <div key={period} className='p-4'>
              <div className='text-muted-foreground mb-2 text-sm font-semibold capitalize'>
                {period}
              </div>
              {chats.map(renderChat)}
            </div>
          ))}
        </SidebarMenu>
      </ScrollArea>
    </>
  )
}
