import type { Chat, Message, ParsedMessage } from "@web/lib/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@web/components/ui/accordion';
import { memo, useCallback, useState } from "react";
import { Textarea } from "../ui/textarea";
import type { MyUser } from "@web/hooks/use-user";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { AlertTriangleIcon, CheckIcon, CopyIcon, Edit3Icon, GitBranchIcon, Loader2Icon, RotateCcwIcon, XIcon } from "lucide-react";
import { getChatMessages, retryMessage } from "@web/lib/messages";
import type { ModelId } from "@server/utils/models";
import { Attachment } from "./attachment";
import { cn } from "@web/lib/utils";
import { id } from "@instantdb/core";
import { createChat } from "@web/lib/chats";
import { db } from "@web/lib/instant";
import { useNavigate } from "@tanstack/react-router";

const handleCopyMessage = async (message: Message) => {
  try {
    await navigator.clipboard.writeText(message.content);
    toast.success('Message copied to clipboard');
  } catch (error) {
    console.error('Failed to copy message:', error);
    toast.error('Failed to copy message');
  }
};


type Props = {
  message: ParsedMessage;
  chat: Chat;
  isProcessing: boolean;
  user: MyUser;
}

export const UserMessage = memo(({ message, chat, isProcessing, user }: Props) => {
  const navigate = useNavigate();
  const [editingContent, setEditingContent] = useState<null | string>(null);

  const handleSaveRetry = useCallback(async (message: Message) => {
    if (isProcessing || !user.data) return;
    if (!editingContent?.trim()) {
      toast.error('Message cannot be empty');
      setEditingContent(null);
      return;
    }

    try {
      await retryMessage(
        message,
        editingContent,
        user.data.id,
        chat.model as ModelId,
        false,
        'off',
      );
      toast.success('Message retried successfully');
    } catch (error) {
      console.error('Failed to retry message:', error);
      toast.error('Failed to retry message');
    } finally {
      setEditingContent(null);
    }
  }, [editingContent, isProcessing, user.data]);

  const createNewBranch = async (message: Message) => {
    if (!user.data) return;
    const messages = await getChatMessages(chat.id);
    const messageIndex = messages.findIndex(m => m.id === message.id);
    if (messageIndex === -1) {
      toast.error('Could not find the message to branch from.');
      return;
    }

    const messagesToCopy = messages.slice(0, messageIndex + 1);

    const newChatId = id();
    const newChatTitle = chat.title;

    const createChatTx = createChat(
      user.data,
      newChatTitle,
      newChatId,
      chat.model as ModelId,
      chat.id, // branchId (parent chat ID)
      chat.projectId, // inherit project from parent chat
    );

    const newMessageTxs = messagesToCopy.map(msgToCopy => {
      const newMsgId = id();
      const {
        files,
        id: _id,
        chatId: _oldChatId,
        highlightedText: _oldHighlightedText,
        highlightedReasoning: _oldHighlightedReasoning,
        ...restOfMsg
      } = msgToCopy;
      const newMessageData = {
        ...restOfMsg,
        id: newMsgId,
        chatId: newChatId,
      };

      const links: { chat: string; files?: string[] } = { chat: newChatId };
      const fileIds = files?.map(f => f.id);
      if (fileIds?.length) {
        links.files = fileIds;
      }
      return db.tx.messages[newMsgId]!.update(newMessageData).link(links);
    });

    try {
      await db.transact([createChatTx, ...newMessageTxs]);
      navigate({ to: '/$chatId', params: { chatId: newChatId } });
      toast.success('Successfully created a new branch!');
    } catch (error) {
      console.error('Failed to create a new branch:', error);
      toast.error('Failed to create a new branch.');
    }
  };

  return (
    <div data-role={message.role} className={cn(message.role === 'user' && 'flex justify-end')}>
      <div>
        {editingContent ? (
          <div className='space-y-2'>
            <Textarea
              value={editingContent}
              onChange={e => setEditingContent(e.target.value)}
              className='resize-none'
              autoFocus
              disabled={isProcessing}
              onKeyDown={e => {
                if (isProcessing) return;
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveRetry(message);
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  setEditingContent(null);
                }
              }}
            />
            <div className='flex justify-end gap-2'>
              <Button
                size='sm'
                variant='outline'
                onClick={() => setEditingContent(null)}
                disabled={isProcessing}
              >
                <XIcon className='h-3 w-3' />
              </Button>
              <Button
                size='sm'
                onClick={() => handleSaveRetry(message)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2Icon className='h-3 w-3 animate-spin' />
                ) : (
                  <CheckIcon className='h-3 w-3' />
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className='group'>
            {message.highlightedReasoning && message.highlightedReasoning.trim() && (
              <div className='mb-3'>
                <Accordion type='single' collapsible>
                  <AccordionItem value='reasoning'>
                    <AccordionTrigger className='text-muted-foreground hover:text-foreground cursor-pointer text-sm'>
                      <span>Reasoning</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div
                        className='text-muted-foreground prose prose-sm reasoning ml-6 max-w-none text-sm'
                        dangerouslySetInnerHTML={{
                          __html: message.highlightedReasoning,
                        }}
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}
            <div className={cn(message.role === 'user' && 'bg-secondary rounded-lg p-2')}>
              <span
                dangerouslySetInnerHTML={{
                  __html: message.highlightedText || '',
                }}
                className='text-secondary-foreground'
              />
              {message.files?.map(file => <Attachment file={file} key={file.id} />)}
            </div>
            {message.aborted && (
              <div className='bg-destructive/10 text-destructive border-destructive/20 m-4 flex items-center justify-between rounded-lg border p-3 text-sm'>
                <div className='flex items-center gap-2'>
                  <AlertTriangleIcon className='h-5 w-5' />
                  <span>Message generation was stopped.</span>
                </div>
              </div>
            )}
            <div className={cn('mt-1 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100', message.role === 'user' && 'justify-end')}>
              <Button
                size='sm'
                variant='ghost'
                className='h-6 w-6 p-0 opacity-60 hover:opacity-100'
                onClick={async () => {
                  if (user.isPending) return;
                  // TODO: pass webSearchEnabled and reasoning params
                  await retryMessage(
                    message,
                    message.content,
                    user.data?.id ?? '',
                    chat.model as ModelId,
                    false,
                    'off',
                  );
                }}
                title='Retry message'
                disabled={isProcessing}
              >
                <RotateCcwIcon className='h-3 w-3' />
              </Button>
              {message.role === 'assistant' && (
                <Button
                  size='sm'
                  variant='ghost'
                  className='h-6 w-6 p-0 opacity-60 hover:opacity-100'
                  onClick={() => createNewBranch(message)}
                  title='Branch off'
                  disabled={isProcessing}
                >
                  <GitBranchIcon className='size-4' />
                </Button>
              )}
              <Button
                size='sm'
                variant='ghost'
                className='h-6 w-6 p-0 opacity-60 hover:opacity-100'
                onClick={() => setEditingContent(message.content)}
                title='Edit message'
                disabled={isProcessing}
              >
                <Edit3Icon className='h-3 w-3' />
              </Button>
              <Button
                size='sm'
                variant='ghost'
                className='h-6 w-6 p-0 opacity-60 hover:opacity-100'
                onClick={() => handleCopyMessage(message)}
                title='Copy message'
              >
                <CopyIcon className='h-3 w-3' />
              </Button>
              {message.time && (
                <span className='text-muted-foreground text-xs'>
                  {(message.time / 1000).toFixed(2)}s
                </span>
              )}
              {message.tokens && (
                <span className='text-muted-foreground text-xs'>
                  {message.tokens} tokens
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}, (prev, next) => prev.message.highlightedText === next.message.highlightedText);
UserMessage.displayName = "UserMessage";
