import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@web/components/ui/context-menu';
import { Input } from '@web/components/ui/input';
import { SidebarMenu } from '@web/components/ui/sidebar';
import { useUser } from '@web/hooks/use-user';
import { db } from '@web/lib/instant';
import {
  assignChatToProject,
  deleteProject,
  toggleProjectPin,
  updateProjectName,
} from '@web/lib/projects';
import type { Chat, Project } from '@web/lib/types';
import { cn } from '@web/lib/utils';
import {
  ChevronDown,
  ChevronRight,
  FileEdit,
  Folder,
  FolderOpen,
  Pin,
  PinOff,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ProjectButton } from './project-button';
import { useConfirmDialog } from './providers/confirm-dialog-provider';
import { ChatItem } from './sidebar/chat-item';
import { useIsOnline } from './providers/is-online';

export function ProjectList({ allChats }: { allChats?: Chat[] }) {
  const user = useUser();
  const connection = useIsOnline();
  const { confirmDelete } = useConfirmDialog();
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(),
  );
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [dragOverProjectId, setDragOverProjectId] = useState<string | null>(
    null,
  );

  const { data } = db.useQuery(
    !user.isPending
      ? {
          projects: {
            $: {
              where: {
                userId: user.data?.id || '',
              },
              order: {
                updatedAt: 'desc',
              },
            },
            chats: {},
          },
        }
      : null,
  );

  const projects = (data?.projects || []) as (Project & { chats?: Chat[] })[];

  const toggleExpanded = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const handleUpdateName = async () => {
    if (!editingProjectId) return;
    const project = projects.find(p => p.id === editingProjectId);
    if (project && editingName.trim() && editingName.trim() !== project.name) {
      await updateProjectName(project, editingName.trim());
    }
    setEditingProjectId(null);
    setEditingName('');
  };

  const handleDeleteProject = (project: Project) => {
    confirmDelete({
      title: 'Delete Project',
      description: `Are you sure you want to delete "${project.name}"? Chats in this project will be deleted.`,
      handleConfirm: () => deleteProject(project),
      handleCancel: () => setEditingProjectId(null),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleUpdateName();
    } else if (e.key === 'Escape') {
      setEditingProjectId(null);
      setEditingName('');
    }
  };

  const handleDragOver = (e: React.DragEvent, projectId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverProjectId(projectId);
  };

  const handleDragEnter = (e: React.DragEvent, projectId: string) => {
    e.preventDefault();
    setDragOverProjectId(projectId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear drag over if we're actually leaving the drop zone
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setDragOverProjectId(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetProjectId: string) => {
    e.preventDefault();
    if (!connection.isOnline && !connection.isChecking) {
      toast.error('You must be online to move chats');
      return;
    }
    setDragOverProjectId(null);

    try {
      let dragData = null;
      try {
        dragData = JSON.parse(e.dataTransfer.getData('application/json'));
      } catch (_) {
        const chatId = new URL(e.dataTransfer.getData('text')).pathname.split(
          '/',
        )[1];
        dragData = allChats?.find(c => c.id === chatId);
        if (dragData) {
          dragData = {
            ...dragData,
            type: 'chat',
            currentProjectId: dragData.projectId,
            chatTitle: dragData.title,
            chatId: dragData.id,
          };
        }
      }

      if (dragData.type === 'chat') {
        const { chatId, chatTitle, currentProjectId } = dragData;

        // Don't allow dropping on the same project
        if (currentProjectId === targetProjectId) {
          toast.info('Chat is already in this project');
          return;
        }

        // Find the chat object
        const chat = allChats
          ? allChats.find(c => c.id === chatId)
          : projects.flatMap(p => p.chats || []).find(c => c.id === chatId);

        if (!chat) {
          toast.error('Chat not found');
          return;
        }

        // Assign chat to new project
        await assignChatToProject(chat, targetProjectId);

        const targetProject = projects.find(p => p.id === targetProjectId);
        toast.success(`Moved "${chatTitle}" to "${targetProject?.name}"`);

        // Auto-expand the target project to show the newly added chat
        if (!expandedProjects.has(targetProjectId)) {
          setExpandedProjects(prev => new Set([...prev, targetProjectId]));
        }
      }
    } catch (error) {
      console.error('Error handling drop:', error);
      toast.error('Failed to move chat to project');
    }
  };

  return (
    <div className='px-4'>
      <div className='text-muted-foreground mb-3 flex gap-x-2 text-xs font-semibold tracking-wide uppercase'>
        Projects
      </div>
      <ProjectButton />
      <div className='chat-scrollbar overflow-auto overflow-x-hidden'>
        <SidebarMenu>
          {projects.map(project => {
            const isExpanded = expandedProjects.has(project.id);
            const projectChats = project.chats || [];
            const isDragOver = dragOverProjectId === project.id;

            return (
              <div key={project.id} className='space-y-1'>
                <ContextMenu>
                  <ContextMenuTrigger asChild>
                    <div
                      onDragOver={e => handleDragOver(e, project.id)}
                      onDragEnter={e => handleDragEnter(e, project.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={e => handleDrop(e, project.id)}
                      className={cn(
                        'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-colors',
                        'hover:bg-accent/50',
                        'group',
                        isDragOver && 'bg-accent/50',
                      )}
                      onClick={() => toggleExpanded(project.id)}
                    >
                      <div className='flex min-w-0 flex-1 items-center gap-2'>
                        {isExpanded ? (
                          <FolderOpen
                            className={cn(
                              'size-4',
                              isDragOver
                                ? 'text-muted-foreground/50'
                                : 'text-muted-foreground',
                            )}
                          />
                        ) : (
                          <Folder
                            className={cn(
                              'size-4',
                              isDragOver
                                ? 'text-muted-foreground/50'
                                : 'text-muted-foreground',
                            )}
                          />
                        )}
                        {project.pinned && (
                          <Pin
                            className={cn(
                              'size-3',
                              isDragOver
                                ? 'text-muted-foreground/50'
                                : 'text-muted-foreground',
                            )}
                          />
                        )}
                        {editingProjectId === project.id ? (
                          <Input
                            value={editingName}
                            onChange={e => setEditingName(e.target.value)}
                            onBlur={handleUpdateName}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            onFocus={e => e.target.select()}
                            className='h-6 border-none bg-transparent p-0 px-1 text-sm outline-none'
                          />
                        ) : (
                          <span
                            className={cn(
                              'truncate text-sm font-medium',
                              isDragOver && 'text-muted-foreground/50',
                            )}
                          >
                            {project.name}
                          </span>
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-xs',
                          isDragOver
                            ? 'text-muted-foreground/50'
                            : 'text-muted-foreground',
                        )}
                      >
                        {projectChats.length}
                      </span>
                      {projectChats.length > 0 ? (
                        isExpanded ? (
                          <ChevronDown
                            className={cn(
                              'size-4',
                              isDragOver
                                ? 'text-muted-foreground/50'
                                : 'text-muted-foreground',
                            )}
                          />
                        ) : (
                          <ChevronRight
                            className={cn(
                              'size-4',
                              isDragOver
                                ? 'text-muted-foreground/50'
                                : 'text-muted-foreground',
                            )}
                          />
                        )
                      ) : (
                        <div className='size-4' />
                      )}
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => toggleProjectPin(project)}>
                      {project.pinned ? (
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
                        setEditingProjectId(project.id);
                        setEditingName(project.name);
                      }}
                    >
                      <FileEdit className='mr-2 size-4' />
                      Rename
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      variant='destructive'
                      onClick={() => handleDeleteProject(project)}
                    >
                      <Trash2 className='mr-2 size-4' />
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
                {isExpanded && projectChats.length > 0 && (
                  <div className='ml-2'>
                    <div className='space-y-1'>
                      {projectChats.map(chat => (
                        <ChatItem
                          className="w-[calc(var(--sidebar-width)-2.55rem)]"
                          projects={projects ?? []}
                          key={chat.id}
                          chat={chat}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </SidebarMenu>
      </div>
    </div>
  );
}
