import { id } from '@instantdb/core';
import { Button } from '@web/components/ui/button';
import { Textarea } from '@web/components/ui/textarea';
import { useChatScroll } from '@web/hooks/use-chat-scroll';
import {
  copyMessageToClipboard,
  type CreateMessageInput,
  retryMessage,
  saveMessage,
  sendMessage,
} from '@web/lib/messages';
import type { Chat as ChatType, Message } from '@web/lib/types';
import { Check, Copy, Edit3, Loader2, RotateCcw, X } from 'lucide-react';
import { type Dispatch, type SetStateAction, useState } from 'react';
import { toast } from 'sonner';
import { type ModelId } from '@server/utils/models';
import { ChatFooter } from './footer';
import { useUser } from '@web/hooks/use-user';
import { updateChatModel } from '@web/lib/chats';

type ChatProps = {
  chat: ChatType;
  messages?: (Message & { parsedContent?: string })[];
  onSubmit?: (message: string) => void;
  setParsedMessages: Dispatch<SetStateAction<Message[]>>;
  areChatsLoading: boolean;
};

export function Chat({
  chat,
  messages = [],
  onSubmit,
  setParsedMessages,
  areChatsLoading,
}: ChatProps) {
  const user = useUser();
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messageFiles, setMessageFiles] = useState<string[]>([]);
  const {
    setActivateScroll,
    scrollRef,
    messagesContainerRef,
    scrollButtonRef,
  } = useChatScroll({ messages, areChatsLoading });

  const handleNewMessage = async (message: string) => {
    if (user.isPending) return;
    if (onSubmit) {
      onSubmit(message);
      return;
    }
    setActivateScroll(true);
    if (chat) {
      const newMessage = {
        chatId: chat.id,
        role: 'user' as const,
        content: message,
        model: chat.model as ModelId,
      };
      const messagesForApi: CreateMessageInput[] = [
        ...messages.map(m => ({
          chatId: chat.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          model: m.model as ModelId,
        })),
        newMessage,
      ];
      const newMessageId = id();
      setParsedMessages(prev => [
        ...prev,
        {
          ...newMessage,
          role: newMessage.role,
          id: newMessageId,
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      ]);
      await saveMessage(newMessage, newMessageId, messageFiles);
      await sendMessage(messagesForApi, user.data.id);
      setMessageFiles([]);
    }
  };

  const handleEditMessage = (message: Message) => {
    setEditingMessageId(message.id);
    setEditingContent(message.content);
  };

  const handleSaveRetry = async (message: Message) => {
    if (isProcessing || user.isPending) return;
    if (!editingContent.trim()) {
      toast.error('Message cannot be empty');
      setEditingMessageId(null);
      setEditingContent('');
      return;
    }

    setIsProcessing(true);
    try {
      await retryMessage(
        messages,
        message,
        editingContent,
        user.data.id,
        chat.model as ModelId,
      );
      setEditingMessageId(null);
      setEditingContent('');
      toast.success('Message retried successfully');
    } catch (error) {
      console.error('Failed to retry message:', error);
      toast.error('Failed to retry message');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyMessage = async (message: Message) => {
    try {
      await copyMessageToClipboard(message);
      toast.success('Message copied to clipboard');
    } catch (error) {
      console.error('Failed to copy message:', error);
      toast.error('Failed to copy message');
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  return (
    <>
      <div className='flex h-full flex-col'>
        <div
          ref={messagesContainerRef}
          className='chat-scrollbar h-screen overflow-y-auto'
        >
          <div className='mx-auto max-w-3xl space-y-4 px-4'>
            {messages.map(m => {
              const isEditing = editingMessageId === m.id;
              return m.role === 'user' ? (
                <div data-role='user' key={m.id} className='flex justify-end'>
                  <div className='max-w-xs md:max-w-md'>
                    {isEditing ? (
                      <div className='space-y-2'>
                        <Textarea
                          value={editingContent}
                          onChange={e => setEditingContent(e.target.value)}
                          className='resize-none'
                          autoFocus
                          disabled={isProcessing}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (isProcessing) return;
                              handleSaveRetry(m);
                            }
                            if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                        />
                        <div className='flex justify-end gap-2'>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={handleCancelEdit}
                            disabled={isProcessing}
                          >
                            <X className='h-3 w-3' />
                          </Button>
                          <Button
                            size='sm'
                            onClick={() => handleSaveRetry(m)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <Loader2 className='h-3 w-3 animate-spin' />
                            ) : (
                              <Check className='h-3 w-3' />
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className='group'>
                        <div className='bg-primary text-primary-foreground rounded-lg p-2'>
                          {m.content}
                        </div>
                        <div className='mt-1 flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
                          <Button
                            size='sm'
                            variant='ghost'
                            className='h-6 w-6 p-0 opacity-60 hover:opacity-100'
                            onClick={() => {
                              if (user.isPending) return;
                              retryMessage(
                                messages,
                                m,
                                m.content,
                                user.data.id,
                                chat.model as ModelId,
                              );
                            }}
                            title='Retry message'
                            disabled={isProcessing}
                          >
                            <RotateCcw className='h-3 w-3' />
                          </Button>
                          <Button
                            size='sm'
                            variant='ghost'
                            className='h-6 w-6 p-0 opacity-60 hover:opacity-100'
                            onClick={() => handleEditMessage(m)}
                            title='Edit message'
                            disabled={isProcessing}
                          >
                            <Edit3 className='h-3 w-3' />
                          </Button>
                          <Button
                            size='sm'
                            variant='ghost'
                            className='h-6 w-6 p-0 opacity-60 hover:opacity-100'
                            onClick={() => handleCopyMessage(m)}
                            title='Copy message'
                          >
                            <Copy className='h-3 w-3' />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  key={m.id}
                  dangerouslySetInnerHTML={{ __html: m.parsedContent || '' }}
                />
              );
            })}
          </div>
          <div ref={scrollRef} id='scroll' className='h-40 w-full' />
        </div>
      </div>
      <div className='absolute bottom-0 w-full'>
        <Button
          ref={scrollButtonRef}
          variant='default'
          className='mx-auto mb-3 block'
          onClick={() => {
            scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          Scroll to bottom
        </Button>
        <ChatFooter
          userId={!user.isPending ? user.data.id : undefined}
          setMessageFiles={setMessageFiles}
          onSubmit={handleNewMessage}
          selectedModel={chat.model as ModelId}
          updateModel={(model) => updateChatModel(chat!, model)}
        />
      </div>
    </>
  );
}
