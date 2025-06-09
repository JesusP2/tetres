import * as React from "react";
import {
  Plus,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarRail,
} from "@web/components/ui/sidebar";

import { MessageSquare, Search } from "lucide-react";

import { Button } from "@web/components/ui/button";
import { Input } from "@web/components/ui/input";
import { ScrollArea } from "@web/components/ui/scroll-area";
import { NavUser } from "./nav-user";
import { db } from '@web/lib/instant';
import { type Chat } from '@web/lib/chats';
import { authClient } from '@web/lib/auth-client';
import { groupBy, pipe, sortBy } from 'remeda';
import { Link, useNavigate } from '@tanstack/react-router';

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
    })
  );
};

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const session = authClient.useSession();
  const userId = session.data?.session?.userId;
  const { data } = db.useQuery(
    userId
      ? {
          chats: {
            $: {
              where: {
                userId: userId,
              },
            },
          },
        }
      : {}
  );

  const chats = data?.chats || [];
  const groupedChats = groupChats(chats);
  const navigate = useNavigate();

  const handleNewChat = () => {
    if (session.data?.session) {
      navigate({ to: '/', search: { new: true } });
    }
  };

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="mt-2">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="sticky" />
            <h2 className="text-lg font-semibold">T3.chat</h2>
          </div>
        </SidebarHeader>
        <SidebarContent className="overflow-hidden">
          <div className="p-4 flex flex-col gap-4">
            <Button onClick={handleNewChat}>
              <Plus className="mr-2" /> New Chat
            </Button>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search your threads..."
                className="pl-8"
              />
            </div>
          </div>
          <ScrollArea
            className="h-full overflow-y-auto mr-2 masked-scroll-area"
          >
            <SidebarMenu>
              {Object.entries(groupedChats).map(([period, chats]) => (
                <div key={period} className="p-4">
                  <div className="text-sm font-semibold text-muted-foreground mb-2 capitalize">
                    {period}
                  </div>
                  {chats.map((chat: Chat) => (
                    <SidebarMenuItem key={chat.id}>
                      <Link
                        to="/$chatId"
                        params={{ chatId: chat.id }}
                        className="w-full"
                        activeProps={{
                          className: 'bg-accent text-accent-foreground',
                        }}
                      >
                        <SidebarMenuButton className="w-full justify-start">
                          <MessageSquare className="mr-2" />
                          <span className="truncate">{chat.title}</span>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                  ))}
                </div>
              ))}
            </SidebarMenu>
          </ScrollArea>
        </SidebarContent>
        <SidebarFooter className="mb-2">
          <NavUser />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      {children}
    </>
  );
}
