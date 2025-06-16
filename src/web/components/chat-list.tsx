import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { Button } from '@web/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@web/components/ui/context-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@web/components/ui/dialog';
import { Input } from '@web/components/ui/input';
import { ScrollArea } from '@web/components/ui/scroll-area';
import { SidebarMenu, useSidebar } from '@web/components/ui/sidebar';
import { useUI } from '@web/hooks/use-ui';
import { type MyUser, useUser } from '@web/hooks/use-user';
import { deleteChat, togglePin, updateChatTitle } from '@web/lib/chats';
import { handleCreateChat } from '@web/lib/create-chat';
import { handleExportChat } from '@web/lib/export-chat';
import { db } from '@web/lib/instant';
import type { Chat } from '@web/lib/types';
import { cn } from '@web/lib/utils';
import {
  Download,
  FileEdit,
  GitBranchIcon,
  Pin,
  PinOff,
  Plus,
  PlusIcon,
  Search,
  Trash2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { groupBy, partition, pipe } from 'remeda';
import { useConfirmDialog } from './providers/confirm-dialog-provider';

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

export function ChatList() {
  const user = useUser();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const { data } = db.useQuery(
    !user.isPending
      ? {
          chats: {
            $: {
              where: {
                userId: user.data?.id || '',
              },
              order: {
                updatedAt: 'desc',
              },
            },
          },
        }
      : {},
  );
  const chats = (data?.chats || []) as Chat[];
  const filteredChats = searchQuery
    ? chats.filter(chat =>
        chat.title.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : chats;
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
      <div className='flex flex-col gap-4 p-4 pb-0'>
        <Button onClick={handleNewChat} disabled={!window.navigator.onLine}>
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
      <ChatSearch
        isOpen={searchDialogOpen}
        setIsOpen={setSearchDialogOpen}
        chats={chats}
        user={user}
      />
      <ScrollArea className='masked-scroll-area mr-2 h-full overflow-y-auto'>
        <SidebarMenu className='mt-2'>
          {pinned.length > 0 && (
            <div className='px-4 pt-2 pb-4'>
              <div className='text-muted-foreground mb-3 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase'>
                <Pin className='size-3' />
                Pinned
              </div>
              <div className='space-y-1'>
                {pinned.map(chat => (
                  <RenderChat chat={chat} key={chat.id} />
                ))}
              </div>
            </div>
          )}
          {Object.entries(groupedChats).map(([period, chats]) => (
            <div key={period} className='px-4 pb-4'>
              <div className='text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase'>
                {period}
              </div>
              <div className='space-y-1'>
                {chats.map(chat => (
                  <RenderChat chat={chat} key={chat.id} />
                ))}
              </div>
            </div>
          ))}
        </SidebarMenu>
      </ScrollArea>
    </>
  );
}

function ChatSearch({
  isOpen,
  setIsOpen,
  chats,
  user,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  chats: Chat[];
  user: MyUser;
}) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const { ui } = useUI();

  const filtered = search
    ? chats.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))
    : chats;

  const handleSelect = async (chatId?: string) => {
    if (chatId) {
      navigate({ to: '/$chatId', params: { chatId } });
      setIsOpen(false);
      setSearch('');
    } else if (user.data && ui && window.navigator.onLine) {
      setIsOpen(false);
      setSearch('');
      const newChatId = await handleCreateChat(
        search,
        [],
        false,
        'off',
        user,
        ui,
      );
      if (!newChatId) return;
      await navigate({
        to: '/$chatId',
        params: { chatId: newChatId },
      });
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  // TODO: this useEfffect shouldn't be necessary
  useEffect(() => {
    setSelectedIndex(-1);
  }, [search]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => {
            const newIndex = prev + 1;
            return newIndex >= filtered.length ? -1 : newIndex;
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => {
            const newIndex = prev - 1;
            return newIndex < -1 ? filtered.length - 1 : newIndex;
          });
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex === -1) {
            handleSelect();
          } else {
            handleSelect(filtered[selectedIndex]?.id);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filtered, search]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className='gap-0 p-0'
        showCloseButton={false}
        onOpenAutoFocus={e => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <VisuallyHidden>
          <DialogTitle>Search chats</DialogTitle>
        </VisuallyHidden>
        <VisuallyHidden>
          <DialogDescription>
            Search for a chat by its title or create a new one.
          </DialogDescription>
        </VisuallyHidden>
        <div className='flex items-center gap-2 border-b p-3'>
          <Search className='text-muted-foreground size-4' />
          <span className='text-muted-foreground'>/</span>
          <PlusIcon className='text-muted-foreground size-4' />
          <input
            ref={inputRef}
            type='text'
            placeholder='Search or press enter to create a new chat...'
            className='flex-1 bg-transparent text-sm focus:outline-none'
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className='p-2'>
          <div className='flex items-center justify-between px-2 pb-2'>
            <h2 className='text-muted-foreground text-xs font-semibold'>
              {search ? 'Matching Chats' : 'Recent Chats'}
            </h2>
            <div className='text-muted-foreground flex items-center gap-1 text-xs'>
              <span className='text-xs'>↩</span>
              <span>
                {selectedIndex === -1 ? 'to start new chat' : 'to open'}
              </span>
            </div>
          </div>
          <div className='chat-scrollbar max-h-[300px] overflow-y-auto'>
            {filtered.map((chat, i) => (
              <div
                key={chat.id}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                  'hover:bg-accent/50',
                  selectedIndex === i && 'bg-accent',
                )}
                onClick={() => handleSelect(chat.id)}
                onMouseMove={() => setSelectedIndex(i)}
              >
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-medium'>{chat.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RenderChat({ chat }: { chat: Chat }) {
  const value = useParams({ from: '/_chat' }) as { chatId: string };
  const { width } = useSidebar();
  const { confirmDelete } = useConfirmDialog();
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const isActive = value.chatId === chat.id;

  const handleUpdateTitle = async () => {
    if (!editingChatId) return;
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

  return (
    <ContextMenu key={chat.id}>
      <ContextMenuTrigger asChild>
        <Link to='/$chatId' params={{ chatId: chat.id }}>
          <div
            className={cn(
              'relative mb-1 rounded-lg transition-all duration-200 ease-in-out',
              'hover:bg-accent/50 hover:shadow-sm',
              'group cursor-pointer',
              isActive && 'bg-accent shadow-sm',
              'focus-within:ring-ring focus-within:ring-2 focus-within:ring-offset-2',
            )}
            style={{
              width: `calc(${width} - 2rem)`,
            }}
            onDoubleClick={() => {
              setEditingChatId(chat.id);
              setEditingTitle(chat.title);
            }}
          >
            <div className={cn('flex items-center gap-3 rounded-lg px-3 py-2')}>
              <div className='min-w-0 flex-1 flex items-center'>
                {chat.branchId ? <GitBranchIcon className='size-4 mr-2' /> : null}
                {editingChatId === chat.id ? (
                  <input
                    value={editingTitle}
                    onChange={e => setEditingTitle(e.target.value)}
                    onBlur={handleUpdateTitle}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    onFocus={e => e.target.select()}
                    className='border-none p-0 text-sm font-medium outline-none'
                  />
                ) : (
                  <span
                    className={cn(
                      'truncate text-sm font-medium transition-colors',
                      isActive
                        ? 'text-foreground'
                        : 'text-foreground/80 group-hover:text-foreground',
                    )}
                  >
                    {chat.title}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={() => {
            togglePin(chat);
          }}
        >
          {chat.pinned ? (
            <>
              <PinOff className='mr-2 size-4' />
              Unpin
            </>
          ) : (
            <>
              <Pin className='mr-2 size-4' />
              Pin
            </>
          )}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => {
            setEditingChatId(chat.id);
            setEditingTitle(chat.title);
          }}
        >
          <FileEdit className='mr-2 size-4' />
          Rename
        </ContextMenuItem>
        <ContextMenuItem onClick={() => handleExportChat(chat)}>
          <Download className='mr-2 size-4' />
          Export
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          variant='destructive'
          onClick={() => handleDeleteChat(chat)}
        >
          <Trash2 className='mr-2 size-4' />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
