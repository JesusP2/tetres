import { Button } from '@web/components/ui/button';
import { Textarea } from '@web/components/ui/textarea';
import { useChatScroll } from '../../hooks/use-chat-scroll';
import { useUser } from '@web/hooks/use-user';
import { updateChatModel } from '@web/lib/chats';
import { db } from '@web/lib/instant';
import {
  copyMessageToClipboard,
  createAssistantMessage,
  createUserMessage,
  retryMessage,
} from '@web/lib/messages';
import type { Chat as ChatType, Message } from '@web/lib/types';
import {
  createMessageObject,
  fileToIFile,
  messageToAPIMessage,
} from '@web/lib/utils/message';
import { sendMessage } from '@web/services';
import {
  AlertTriangle,
  BotIcon,
  Check,
  Copy,
  Edit3,
  Loader2,
  RotateCcw,
  X,
} from 'lucide-react';
import {
  type Dispatch,
  Fragment,
  type SetStateAction,
  useState,
  useRef,
} from 'react';
import { toast } from 'sonner';
import type { ClientUploadedFileData } from 'uploadthing/types';
import { type ModelId } from '@server/utils/models';
import { ChatFooter } from './footer';
import { MessageAttachments } from './message-attachments';

type ChatProps = {
  chat: ChatType;
  messages?: (Message & { highlightedText?: string })[];
  onSubmit?: (message: string) => void;
  setParsedMessages: Dispatch<
    SetStateAction<(Message & { highlightedText?: string })[]>
  >;
};

export function Chat({
  chat,
  messages = [],
  onSubmit,
  setParsedMessages,
}: ChatProps) {
  const user = useUser();
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { showScrollButton, scrollToBottom } = useChatScroll({
    chatId: chat?.id ?? '',
    messagesContainerRef,
    messages,
  });

  const handleNewMessage = async (
    message: string,
    files: ClientUploadedFileData<null>[],
    webSearchEnabled: boolean,
    reasoning: 'off' | 'low' | 'medium' | 'high',
  ) => {
    if (user.isPending) return;
    if (onSubmit) {
      onSubmit(message);
      return;
    }
    if (chat) {
      const newUserMessage = createMessageObject({
        role: 'user',
        content: message,
        model: chat.model as ModelId,
        chatId: chat.id,
        finished: new Date().toISOString(),
        files: files.map(file => fileToIFile(file, chat.id)),
      });
      const newAssistantMessage = createMessageObject({
        role: 'assistant',
        content: {},
        model: chat.model as ModelId,
        chatId: chat.id,
      });
      setParsedMessages(prev => [...prev, newUserMessage]);
      const userMessageTx = createUserMessage(newUserMessage);
      const assistantMessageTx = createAssistantMessage(newAssistantMessage);
      const ifiles = files.map(file => fileToIFile(file, chat.id));
      await db.transact(ifiles.map(file => db.tx.files[file.id].update(file)));
      await db.transact([
        userMessageTx.link({ files: ifiles.map(file => file.id) }),
      ]);
      await db.transact([assistantMessageTx]);

      const messagesForApi = messages.map(m => messageToAPIMessage(m));
      messagesForApi.push(messageToAPIMessage(newUserMessage));
      await sendMessage({
        messages: messagesForApi,
        userId: user.data.id,
        messageId: newAssistantMessage.id,
        model: chat.model,
        chatId: chat.id,
        webSearchEnabled,
        reasoning,
      });
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

    // TODO: isProcessing is probably not needed
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
          <div className='mx-auto max-w-3xl space-y-4 px-4 mb-10'>
            {messages.map(m => {
              const isEditing = editingMessageId === m.id;
              const isLoading =
                m.role === 'assistant' &&
                (!m.content || Object.keys(m.content).length === 0);
              const isAborted = m.aborted !== undefined;
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
                        <div className='bg-primary rounded-lg p-2'>
                          <span className='text-primary-foreground'>
                            {m.content}
                          </span>
                          <MessageAttachments files={m.files || []} />
                        </div>
                        <div className='mt-1 flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
                          <Button
                            size='sm'
                            variant='ghost'
                            className='h-6 w-6 p-0 opacity-60 hover:opacity-100'
                            onClick={async () => {
                              if (user.isPending) return;
                              await retryMessage(
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
              ) : isLoading ? (
                <div
                  key={m.id}
                  className='flex items-start gap-4'
                  data-role='assistant'
                >
                  <div className='bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-full'>
                    <BotIcon className='h-5 w-5' />
                  </div>
                  <div className='flex flex-1 items-center space-y-2 pt-1'>
                    <div className='flex items-center gap-1'>
                      <div className='bg-foreground h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]' />
                      <div className='bg-foreground h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]' />
                      <div className='bg-foreground h-2 w-2 animate-bounce rounded-full' />
                    </div>
                  </div>
                </div>
              ) : (
                <Fragment key={m.id}>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: m.highlightedText || '',
                    }}
                  />
                  <MessageAttachments files={m.files || []} />
                  {isAborted && (
                    <div className='bg-destructive/10 text-destructive border-destructive/20 m-4 flex items-center justify-between rounded-lg border p-3 text-sm'>
                      <div className='flex items-center gap-2'>
                        <AlertTriangle className='h-5 w-5' />
                        <span>Message generation was stopped.</span>
                      </div>
                    </div>
                  )}
                </Fragment>
              );
            })}
          </div>
          <div id='scroll' className='h-40 w-full' />
        </div>
      </div>
      <div className='absolute bottom-0 w-full'>
        {showScrollButton && (
          <Button
            variant='default'
            className='mx-auto mb-3 block'
            onClick={() => scrollToBottom('smooth')}
          >
            Scroll to bottom
          </Button>
        )}
        <ChatFooter
          onSubmit={handleNewMessage}
          selectedModel={chat.model as ModelId}
          updateModel={model => updateChatModel(chat, model)}
          lastMessage={messages[messages.length - 1]}
        />
      </div>
    </>
  );
}

