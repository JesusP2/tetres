import { id } from '@instantdb/core';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from '@web/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
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
import {
  SidebarMenu,
  sidebarMenuButtonVariants,
  SidebarMenuItem,
} from '@web/components/ui/sidebar';
import { useUI } from '@web/hooks/use-ui';
import { useUser, type MyUser } from '@web/hooks/use-user';
import {
  createChat,
  deleteChat,
  togglePin,
  updateChatTitle,
  updateChatProject,
} from '@web/lib/chats';
import { db } from '@web/lib/instant';
import { createAssistantMessage, createUserMessage } from '@web/lib/messages';
import { createProject } from '@web/lib/projects';
import type { Chat, Project } from '@web/lib/types';
import {
  createMessageObject,
  messageToAPIMessage,
} from '@web/lib/utils/message';
import { renameChat, sendMessage } from '@web/services';
import { FolderPlus, Pin, PinOff, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { groupBy, partition, pipe, sortBy } from 'remeda';
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
    sortBy([(c: Chat) => c.updatedAt, 'desc']),
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
              userId: user.data?.id || '',
            },
          },
        },
        projects: {
          $: {
            where: {
              userId: user.data?.id || '',
            },
          },
        },
      }
      : {},
  );
  
  const allChats = (data?.chats || []) as Chat[];
  const projects = (data?.projects || []) as Project[];
  
  // Filter out chats that belong to projects
  const orphanedChats = allChats.filter(chat => !chat.projectId);
  
  const filteredChats = searchQuery
    ? orphanedChats.filter(chat =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    : orphanedChats;
  const [pinned, unpinned] = partition(filteredChats, c => c.pinned);
  const groupedChats = groupChats(unpinned);

  const handleUpdateTitle = async () => {
    if (!editingChatId) return;
    const chat = allChats.find(c => c.id === editingChatId);
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

  const handleAddChatToProject = async (chat: Chat, projectId: string) => {
    await updateChatProject(chat, projectId);
  };

  const handleAddChatToNewProject = async (chat: Chat, projectName: string) => {
    if (!user.data) return;
    
    try {
      const newProjectId = crypto.randomUUID();
      const projectTx = createProject(user.data, projectName, newProjectId);
      await db.transact(projectTx);
      await updateChatProject(chat, newProjectId);
    } catch (error) {
      console.error('Failed to create project and move chat:', error);
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
        <ContextMenu>
          <ContextMenuTrigger asChild>
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
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem
              onClick={() => {
                setEditingChatId(chat.id);
                setEditingTitle(chat.title);
              }}
            >
              Rename
            </ContextMenuItem>
            <ContextMenuItem onClick={() => togglePin(chat)}>
              {chat.pinned ? (
                <>
                  <PinOff className="mr-2 h-4 w-4" />
                  Unpin
                </>
              ) : (
                <>
                  <Pin className="mr-2 h-4 w-4" />
                  Pin
                </>
              )}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <FolderPlus className="mr-2 h-4 w-4" />
                Add to Project
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                {projects.map(project => (
                  <ContextMenuItem
                    key={project.id}
                    onClick={() => handleAddChatToProject(chat, project.id)}
                  >
                    {project.name}
                  </ContextMenuItem>
                ))}
                <ContextMenuSeparator />
                <ContextMenuItem
                  onClick={() => {
                    const projectName = prompt('Enter project name:');
                    if (projectName?.trim()) {
                      handleAddChatToNewProject(chat, projectName.trim());
                    }
                  }}
                >
                  <FolderPlus className="mr-2 h-4 w-4" />
                  New Project
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => handleDeleteChat(chat)}
              variant="destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )}
    </SidebarMenuItem>
  );

  if (orphanedChats.length === 0) {
    return null;
  }

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
      <ChatSearch
        isOpen={searchDialogOpen}
        setIsOpen={setSearchDialogOpen}
        chats={allChats}
        user={user}
      />
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

  const handleCreateChat = async () => {
    if (!user.data || !search.trim() || !ui) return;
    setIsOpen(false);
    setSearch('');
    const newChatId = id();
    const messageContent = search.trim();
    const chatTx = createChat(
      user.data,
      'New Chat',
      newChatId,
      ui.defaultModel,
    );
    const userMessage = createMessageObject({
      chatId: newChatId,
      role: 'user',
      content: messageContent,
      model: ui.defaultModel,
      finished: new Date().toISOString(),
    });
    const assistantMessage = createMessageObject({
      chatId: newChatId,
      role: 'assistant',
      content: {},
      model: ui.defaultModel,
    });
    const apiMessage = messageToAPIMessage(userMessage);
    const userMessageTx = createUserMessage(userMessage);
    const assistantMessageTx = createAssistantMessage(assistantMessage);
    await db.transact([chatTx, userMessageTx, assistantMessageTx]);
    await Promise.all([
      renameChat(newChatId, messageContent),
      sendMessage({
        messages: [apiMessage],
        userId: user.data.id,
        messageId: assistantMessage.id,
        model: ui.defaultModel,
        chatId: userMessage.chatId,
        webSearchEnabled: false,
        reasoning: 'off',
      })
    ])
    await navigate({ to: '/$chatId', params: { chatId: newChatId } });
  };

  const handleSelect = (chatId?: string) => {
    if (chatId) {
      navigate({ to: '/$chatId', params: { chatId } });
      setIsOpen(false);
      setSearch('');
    } else {
      void handleCreateChat();
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
        className='p-0'
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
          <Search className='text-muted-foreground h-5 w-5' />
          <input
            ref={inputRef}
            type='text'
            placeholder='Search chats...'
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
                className={`flex cursor-pointer items-center gap-3 rounded-md p-2 ${selectedIndex === i ? 'bg-accent' : ''
                  }`}
                onClick={() => handleSelect(chat.id)}
                onMouseMove={() => setSelectedIndex(i)}
              >
                <span className='truncate'>{chat.title}</span>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
