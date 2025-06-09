import * as React from "react";
import {
  Plus,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@web/components/ui/avatar";
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

const chatHistory = {
  today: [{ title: "Greeting" }, { title: "Response to kkkkk" }],
  yesterday: [
    { title: "Texto y preguntas 3", withIcon: true },
    { title: "Texto y preguntas 2", withIcon: true },
    { title: "extract text 1" },
    { title: "HTML Ergonomics Content Extraction" },
    { title: "extract text 2", withIcon: true },
  ],
  "last 7 days": [
    { title: "Texto y preguntas 1" },
    { title: "RESICO en México ¿Qué es?" },
    { title: "Regex Explanation" },
    { title: "Throttling logic check" },
    { title: "Services folder usage in codebase" },
  ],
  "last 30 days": [{ title: "uv add manim fails to build m..." }],
  "older": [{ title: "uv add manim fails to build m..." }],
};
export function AppSidebar({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <SidebarTrigger className="sticky" />
            <h2 className="text-lg font-semibold">T3.chat</h2>
          </div>
        </SidebarHeader>
        <SidebarContent className="overflow-hidden">
          <div className="p-4 flex flex-col gap-4">
            <Button>
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
              {Object.entries(chatHistory).map(([period, chats]) => (
                <div key={period} className="p-4">
                  <div className="text-sm font-semibold text-muted-foreground mb-2 capitalize">
                    {period}
                  </div>
                  {chats.map((chat) => (
                    <SidebarMenuItem key={chat.title}>
                      <SidebarMenuButton
                        className="w-full justify-start"
                      >
                        {'withIcon' in chat && chat.withIcon && <MessageSquare className="mr-2" />}
                        <span className="truncate">{chat.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </div>
              ))}
            </SidebarMenu>
          </ScrollArea>
        </SidebarContent>
        <SidebarFooter>
          <div className="p-4">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src="/avatars/user.png" alt="Jesus Perez" />
                <AvatarFallback className="rounded-lg">J</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="font-semibold">Jesus Perez</span>
                <span className="text-xs text-muted-foreground">Pro</span>
              </div>
            </Button>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      {children}
    </>
  );
}
