import { Link, useParams } from '@tanstack/react-router';
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
import { deleteChat, togglePin, updateChatTitle } from '@web/lib/chats';
import { handleExportChat } from '@web/lib/export-chat';
import { assignChatToProject, removeChatFromProject } from '@web/lib/projects';
import type { Chat, Project } from '@web/lib/types';
import { cn } from '@web/lib/utils';
import {
  Download,
  FileEdit,
  FolderPlus,
  GitBranchIcon,
  Pin,
  PinOff,
  Share2Icon,
  Trash2,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { ShareDialog } from '../chat/share-dialog';
import { useConfirmDialog } from '../providers/confirm-dialog-provider';

export function ChatItem({
  chat,
  projects,
  className,
}: {
  chat: Chat;
  projects: Project[];
  className?: string;
}) {
  const value = useParams({ from: '/_chat' }) as { chatId: string };
  const { confirmDelete } = useConfirmDialog();
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
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

  const handleAssignToProject = async (projectId: string) => {
    await assignChatToProject(chat, projectId);
  };

  const handleRemoveFromProject = async () => {
    await removeChatFromProject(chat);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleUpdateTitle();
    } else if (e.key === 'Escape') {
      setEditingChatId(null);
      setEditingTitle('');
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        type: 'chat',
        chatId: chat.id,
        chatTitle: chat.title,
        currentProjectId: chat.projectId || null,
      }),
    );
    e.dataTransfer.effectAllowed = 'move';

    // Add some visual feedback to the drag image
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  return (
    <>
      <ContextMenu key={chat.id}>
        <ContextMenuTrigger asChild>
          <Link to='/$chatId' params={{ chatId: chat.id }}>
            <div
              draggable={!editingChatId}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              className={cn(
                'relative mb-1 rounded-lg transition-all duration-200 ease-in-out',
                'hover:bg-accent/50 hover:shadow-sm w-[calc(var(--sidebar-width)-2rem)]',
                'group cursor-pointer',
                isActive && 'bg-accent shadow-sm',
                'focus-within:ring-ring focus-within:ring-2 focus-within:ring-offset-2',
                isDragging && 'scale-95 opacity-50',
                className,
              )}
              style={{
                cursor: isDragging ? 'grabbing' : 'grab',
              }}
              onDoubleClick={() => {
                setEditingChatId(chat.id);
                setEditingTitle(chat.title);
              }}
            >
              <div
                className={cn('flex items-center gap-3 rounded-lg px-3 py-2')}
              >
                <div className='flex min-w-0 flex-1 items-center'>
                  {chat.branchId ? (
                    <GitBranchIcon className='mr-2 size-4' />
                  ) : null}
                  {editingChatId === chat.id ? (
                    <input
                      ref={inputRef}
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
              // NOTE: to whoever is reading this, I'm sorry 
              setTimeout(() => {
                inputRef.current?.focus();
              }, 100);
            }}
          >
            <FileEdit className='mr-2 size-4' />
            Rename
          </ContextMenuItem>

          {/* Project Assignment Menu */}
          {chat.projectId ? (
            <ContextMenuItem onClick={handleRemoveFromProject}>
              <FolderPlus className='mr-2 size-4' />
              Remove from Project
            </ContextMenuItem>
          ) : (
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <FolderPlus className='mr-2 size-4' />
                Add to Project
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                {projects.map(project => (
                  <ContextMenuItem
                    key={project.id}
                    onClick={() => handleAssignToProject(project.id)}
                  >
                    {project.name}
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>
          )}

          <ContextMenuItem onClick={() => handleExportChat(chat)}>
            <Download className='mr-2 size-4' />
            Export
          </ContextMenuItem>
          <ContextMenuItem onClick={() => setIsShareDialogOpen(true)}>
            <Share2Icon className='h-4 w-4' />
            Share
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
      <ShareDialog
        isOpen={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        chat={chat}
      />
    </>
  );
}
