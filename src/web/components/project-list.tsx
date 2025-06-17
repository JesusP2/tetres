import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@web/components/ui/context-menu';
import { Input } from '@web/components/ui/input';
import { ScrollArea } from '@web/components/ui/scroll-area';
import { SidebarMenu } from '@web/components/ui/sidebar';
import { useUser } from '@web/hooks/use-user';
import { db } from '@web/lib/instant';
import {
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
import { ProjectButton } from './project-button';
import { useConfirmDialog } from './providers/confirm-dialog-provider';
import { ChatItem } from './sidebar/chat-item';

export function ProjectList() {
  const user = useUser();
  const { confirmDelete } = useConfirmDialog();
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(),
  );
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

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
      : {},
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

  return (
    <div className='px-4 pb-4'>
      <div className='text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase'>
        Projects
      </div>
      <ProjectButton />
      <ScrollArea className='h-48'>
        <SidebarMenu>
          {projects.map(project => {
            const isExpanded = expandedProjects.has(project.id);
            const projectChats = project.chats || [];

            return (
              <div key={project.id} className='space-y-1'>
                <ContextMenu>
                  <ContextMenuTrigger asChild>
                    <div
                      className={cn(
                        'mr-4 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-colors',
                        'hover:bg-accent/50',
                        'group',
                      )}
                      onClick={() => toggleExpanded(project.id)}
                    >
                      <div className='flex min-w-0 flex-1 items-center gap-2'>
                        {isExpanded ? (
                          <FolderOpen className='text-muted-foreground size-4' />
                        ) : (
                          <Folder className='text-muted-foreground size-4' />
                        )}
                        {project.pinned && (
                          <Pin className='text-muted-foreground size-3' />
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
                          <span className='truncate text-sm font-medium'>
                            {project.name}
                          </span>
                        )}
                      </div>
                      <span className='text-muted-foreground text-xs'>
                        {projectChats.length}
                      </span>
                      {projectChats.length > 0 ? (
                        isExpanded ? (
                          <ChevronDown className='text-muted-foreground size-4' />
                        ) : (
                          <ChevronRight className='text-muted-foreground size-4' />
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
      </ScrollArea>
    </div>
  );
}
