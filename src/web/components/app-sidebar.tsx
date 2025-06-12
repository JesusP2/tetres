import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from '@web/components/ui/button';
import { Input } from '@web/components/ui/input';
import { ScrollArea } from '@web/components/ui/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  sidebarMenuButtonVariants,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from '@web/components/ui/sidebar';
import { type Chat, deleteChat, togglePin, updateChatTitle } from '@web/lib/chats';
import { db } from '@web/lib/instant';
import { Pin, PinOff, Plus, Trash2 } from 'lucide-react';
import { MessageSquare, Search } from 'lucide-react';
import * as React from 'react';
import { groupBy, partition, pipe, sortBy } from 'remeda';
import { NavUser } from './nav-user';
import { useConfirmDialog } from './providers/confirm-dialog-provider';
import { useUser } from '@web/hooks/use-user';

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

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const { confirmDelete } = useConfirmDialog();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [editingChatId, setEditingChatId] = React.useState<string | null>(null);
  const [editingTitle, setEditingTitle] = React.useState('');
  const user = useUser();
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
      <Sidebar collapsible='icon'>
        <SidebarHeader className='mt-2'>
          <div className='flex items-center gap-2'>
            <SidebarTrigger className='sticky' />
            <h2 className='text-lg font-semibold'>T3.chat</h2>
          </div>
        </SidebarHeader>
        <SidebarContent className='overflow-hidden'>
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
        </SidebarContent>
        <SidebarFooter className='mb-2'>
          <NavUser />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      {children}
    </>
  );
}
