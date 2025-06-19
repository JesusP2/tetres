import { id } from '@instantdb/core';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useNavigate } from '@tanstack/react-router';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@web/components/ui/dialog';
import { useUI } from '@web/hooks/use-ui';
import { type MyUser } from '@web/hooks/use-user';
import { handleCreateChat } from '@web/lib/create-chat';
import type { Chat } from '@web/lib/types';
import { cn } from '@web/lib/utils';
import { PlusIcon, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useIsOnline } from '../providers/is-online';

export function ChatSearch({
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
  const connection = useIsOnline();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const { ui } = useUI();

  const filtered = search
    ? chats.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))
    : chats;

  const handleSelect = async (chatId?: string) => {
    if (chatId) {
      navigate({ to: '/$chatId', params: { chatId } });
      setIsOpen(false);
      setSearch('');
    } else if (!connection.isOnline && !connection.isChecking) {
      toast.error('You must be online to create a chat');
    } else if (user.data && ui) {
      setIsOpen(false);
      setSearch('');
      const newChatId = id();
      await Promise.all([
        handleCreateChat(
          newChatId,
          search,
          [],
          false,
          'off',
          user,
          ui,
        ),
        navigate({
          to: '/$chatId',
          params: { chatId: newChatId },
        })
      ]);
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
        className='gap-0 p-0'
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
          <Search className='text-muted-foreground size-4' />
          <span className='text-muted-foreground'>/</span>
          <PlusIcon className='text-muted-foreground size-4' />
          <input
            ref={inputRef}
            type='text'
            placeholder='Search or press enter to create a new chat...'
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
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                  'hover:bg-accent/50',
                  selectedIndex === i && 'bg-accent',
                )}
                onClick={() => handleSelect(chat.id)}
                onMouseMove={() => setSelectedIndex(i)}
              >
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-medium'>{chat.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
