import { ScrollArea } from '@web/components/ui/scroll-area';
import { SidebarMenu } from '@web/components/ui/sidebar';
import type { Chat, Project } from '@web/lib/types';
import { PinIcon } from 'lucide-react';
import { ChatItem } from './chat-item';

export function ChatList({
  projects,
  pinned,
  groupedChats,
}: {
  projects: Project[];
  pinned: Chat[];
  groupedChats: Record<string, Chat[]>;
}) {
  return (
    <ScrollArea className='masked-scroll-area mr-1 h-full overflow-y-auto'>
      <SidebarMenu className='mt-3'>
        {pinned.length > 0 && (
          <div className='px-4 pt-2 pb-4'>
            <div className='text-muted-foreground mb-3 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase'>
              <PinIcon className='size-3' />
              Pinned
            </div>
            <div className='space-y-1'>
              {pinned.map(chat => (
                <ChatItem projects={projects} chat={chat} key={chat.id} />
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
                <ChatItem projects={projects} chat={chat} key={chat.id} />
              ))}
            </div>
          </div>
        ))}
      </SidebarMenu>
    </ScrollArea>
  );
}
