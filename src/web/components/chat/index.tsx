import { ChatFooter } from './footer';
import type { Chat as ChatType, Message } from '@web/lib/types';
import { saveMessage, retryMessage, copyMessageToClipboard, sendMessage } from '@web/lib/messages';
import { authClient } from '@web/lib/auth-client';
import { useState } from 'react';
import { RotateCcw, Edit3, Copy, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@web/components/ui/button';
import { Textarea } from '@web/components/ui/textarea';
import { toast } from 'sonner';

type ChatProps = {
  chat?: ChatType;
  messages?: Message[];
  onSubmit?: (message: string) => void;
};

export function Chat({ chat, messages = [], onSubmit }: ChatProps) {
  const session = authClient.useSession();
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleNewMessage = async (message: string) => {
    if (onSubmit) {
      onSubmit(message);
      return;
    }
    const userId = session.data?.session?.userId;
    if (chat && userId) {
      const messagess = [
        ...messages.map((m) => ({
          chatId: chat.id,
          role: m.role as any,
          content: m.content,
        })),
        {
          chatId: chat.id,
          role: 'user' as const,
          content: message,
        }
      ]
      await saveMessage(messagess);
      await sendMessage(messagess, userId);
    }
  };

  const handleEditMessage = (message: Message) => {
    setEditingMessageId(message.id);
    setEditingContent(message.content);
  };

  const handleSaveRetry = async (message: Message) => {
    if (!editingContent.trim()) {
      toast.error('Message cannot be empty');
      setEditingMessageId(null);
      setEditingContent('');
      return;
    }

    const userId = session.data?.session?.userId;
    if (!userId) {
      toast.error('Please log in to retry messages');
      return;
    }

    setIsProcessing(true);
    try {
      await retryMessage(messages, message, editingContent, userId);
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
      <div className="flex flex-col h-full">
        <div className="h-screen chat-scrollbar overflow-y-auto pb-40">
          <div className="space-y-4 max-w-3xl mx-auto px-4">
            {messages.map((m) => {
              const content = m.content;
              const isEditing = editingMessageId === m.id;

              return m.role === 'user' ? (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-xs md:max-w-md">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className="resize-none"
                          autoFocus
                          disabled={isProcessing}
                          onKeyDown={(e) => {
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
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={isProcessing}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              if (isProcessing) return;
                              handleSaveRetry(m);
                            }}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="group">
                        <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                          {content}
                        </div>
                        <div className="flex gap-1 mt-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                            onClick={() => retryMessage(messages, m, m.content, session.data?.session?.userId)}
                            title="Retry message"
                            disabled={isProcessing}
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                            onClick={() => handleEditMessage(m)}
                            title="Edit message"
                            disabled={isProcessing}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                            onClick={() => handleCopyMessage(m)}
                            title="Copy message"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div key={m.id} dangerouslySetInnerHTML={{ __html: content }} />
              );
            })}
          </div>
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Send a message to start the conversation.
            </div>
          )}
        </div>
      </div>
      <ChatFooter onSubmit={handleNewMessage} />
    </>
  );
} 
