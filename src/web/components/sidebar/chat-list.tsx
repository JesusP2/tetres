import { ScrollArea } from '@web/components/ui/scroll-area';
import { SidebarMenu } from '@web/components/ui/sidebar';
import { removeChatFromProject } from '@web/lib/projects';
import type { Chat, Project } from '@web/lib/types';
import { cn } from '@web/lib/utils';
import { PinIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ChatItem } from './chat-item';

export function ChatList({
  projects,
  allChats,
  pinned,
  groupedChats,
}: {
  projects: Project[];
  allChats: Chat[];
  pinned: Chat[];
  groupedChats: Record<string, Chat[]>;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear drag over if we're actually leaving the drop zone
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragOver(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      let dragData = null;
      try {
        dragData = JSON.parse(e.dataTransfer.getData('application/json'));
      } catch (_) {
        const chatId = new URL(e.dataTransfer.getData('text')).pathname.split('/')[1];
        dragData = allChats.find(c => c.id === chatId);
        if (dragData) {
          dragData = {
            ...dragData,
            type: 'chat',
            currentProjectId: dragData.projectId,
            chatTitle: dragData.title,
            chatId: dragData.id,
          }
        }
      }

      if (dragData?.type === 'chat') {
        const { chatId, chatTitle, currentProjectId } = dragData;

        // Only allow removing from projects (not moving unassigned chats)
        if (!currentProjectId) {
          toast.info('Chat is already unassigned');
          return;
        }

        // Find the chat object from all chats
        const chat = allChats.find(c => c.id === chatId);

        if (!chat) {
          toast.error('Chat not found');
          return;
        }

        // Remove chat from project
        await removeChatFromProject(chat);

        toast.success(`Removed "${chatTitle}" from project`);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
      toast.error('Failed to remove chat from project');
    }
  };

  return (
    <ScrollArea
      className={cn(
        'masked-scroll-area mr-1 h-full overflow-y-auto transition-all duration-200',
      )}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <SidebarMenu className='mt-3'>
        {pinned.length > 0 && (
          <div className='px-4 pt-2 pb-4'>
            <div
              className={cn(
                'mb-3 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase',
                isDragOver
                  ? 'text-muted-foreground/50'
                  : 'text-muted-foreground',
              )}
            >
              <PinIcon className='size-3' />
              Pinned
            </div>
            <div
              className={cn(
                'space-y-1 transition-opacity duration-200',
                isDragOver && 'opacity-50',
              )}
            >
              {pinned.map(chat => (
                <ChatItem projects={projects} chat={chat} key={chat.id} />
              ))}
            </div>
          </div>
        )}
        {Object.entries(groupedChats).map(([period, chats]) => (
          <div key={period} className='px-4 pb-4'>
            <div
              className={cn(
                'mb-3 text-xs font-semibold tracking-wide uppercase',
                isDragOver
                  ? 'text-muted-foreground/50'
                  : 'text-muted-foreground',
              )}
            >
              {period}
            </div>
            <div
              className={cn(
                'space-y-1 transition-opacity duration-200',
                isDragOver && 'opacity-50',
              )}
            >
              {chats.map(chat => (
                <ChatItem projects={projects} chat={chat} key={chat.id} />
              ))}
            </div>
          </div>
        ))}
      </SidebarMenu>
    </ScrollArea>
  );
}
