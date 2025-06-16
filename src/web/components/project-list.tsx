import { Link } from '@tanstack/react-router';
import { Button } from '@web/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@web/components/ui/collapsible';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@web/components/ui/context-menu';
import { Input } from '@web/components/ui/input';
import { ScrollArea } from '@web/components/ui/scroll-area';
import {
  SidebarMenu,
  sidebarMenuButtonVariants,
  SidebarMenuItem,
} from '@web/components/ui/sidebar';
import { useUser } from '@web/hooks/use-user';
import { updateChatProject } from '@web/lib/chats';
import { db } from '@web/lib/instant';
import {
  deleteProject,
  toggleProjectPin,
  updateProjectName,
} from '@web/lib/projects';
import type { Chat, Project } from '@web/lib/types';
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Pin,
  PinOff,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { partition } from 'remeda';
import { useConfirmDialog } from './providers/confirm-dialog-provider';

type ProjectWithChats = Project & {
  chats?: Chat[];
};

export function ProjectList() {
  const user = useUser();
  const { confirmDelete } = useConfirmDialog();
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
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
            },
            chats: {},
          },
        }
      : {},
  );

  const projects = (data?.projects || []) as ProjectWithChats[];
  const [pinnedProjects, unpinnedProjects] = partition(projects, p => p.pinned);

  const toggleProjectExpanded = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const handleUpdateProjectName = async () => {
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
      description: `Are you sure you want to delete "${project.name}"? Chats in this project will not be deleted.`,
      handleConfirm: async () => {
        // Move all chats out of the project first
        if (project.chats) {
          await Promise.all(
            project.chats.map(chat => updateChatProject(chat, null))
          );
        }
        await deleteProject(project);
      },
      handleCancel: () => setEditingProjectId(null),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleUpdateProjectName();
    } else if (e.key === 'Escape') {
      setEditingProjectId(null);
      setEditingName('');
    }
  };

  const renderProject = (project: ProjectWithChats) => {
    const isExpanded = expandedProjects.has(project.id);
    const chats = project.chats || [];

    return (
      <SidebarMenuItem key={project.id} className="group">
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div>
              <Collapsible
                open={isExpanded}
                onOpenChange={() => toggleProjectExpanded(project.id)}
              >
                <CollapsibleTrigger asChild>
                  <div
                    className={sidebarMenuButtonVariants({
                      className: 'w-full justify-start group-hover:bg-accent/50',
                    })}
                    onDoubleClick={() => {
                      setEditingProjectId(project.id);
                      setEditingName(project.name);
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 mr-1" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mr-1" />
                    )}
                    {isExpanded ? (
                      <FolderOpen className="h-4 w-4 mr-2" />
                    ) : (
                      <Folder className="h-4 w-4 mr-2" />
                    )}
                    {editingProjectId === project.id ? (
                      <Input
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onBlur={handleUpdateProjectName}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        onFocus={e => e.target.select()}
                        className="h-6 text-sm"
                      />
                    ) : (
                      <>
                        <span className="truncate flex-1 text-left">{project.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {chats.length}
                        </span>
                      </>
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-6 border-l border-border/50 pl-2">
                    {chats.map(chat => (
                      <Link
                        key={chat.id}
                        to="/$chatId"
                        params={{ chatId: chat.id }}
                        className="w-full block"
                        activeProps={{
                          className: 'bg-accent text-accent-foreground',
                        }}
                      >
                        <div
                          className={sidebarMenuButtonVariants({
                            className: 'w-full justify-start text-sm text-muted-foreground hover:text-foreground',
                          })}
                        >
                          <span className="truncate">{chat.title}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem
              onClick={() => {
                setEditingProjectId(project.id);
                setEditingName(project.name);
              }}
            >
              Rename
            </ContextMenuItem>
            <ContextMenuItem onClick={() => toggleProjectPin(project)}>
              {project.pinned ? (
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
            <ContextMenuItem
              onClick={() => handleDeleteProject(project)}
              variant="destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </SidebarMenuItem>
    );
  };

  if (projects.length === 0) {
    return null;
  }

  return (
    <ScrollArea className="flex-1">
      <SidebarMenu>
        {pinnedProjects.length > 0 && (
          <div className="p-4">
            <div className="text-muted-foreground mb-2 text-sm font-semibold capitalize">
              Pinned Projects
            </div>
            {pinnedProjects.map(renderProject)}
          </div>
        )}
        {unpinnedProjects.length > 0 && (
          <div className="p-4">
            <div className="text-muted-foreground mb-2 text-sm font-semibold capitalize">
              Projects
            </div>
            {unpinnedProjects.map(renderProject)}
          </div>
        )}
      </SidebarMenu>
    </ScrollArea>
  );
}