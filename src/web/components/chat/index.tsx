import { useNavigate, useParams } from '@tanstack/react-router';
import { Button } from '@web/components/ui/button';
import { useUser } from '@web/hooks/use-user';
import { copySharedChat, updateChatModel } from '@web/lib/chats';
import { db } from '@web/lib/instant';
import {
  createAssistantMessage,
  createUserMessage,
  getChatMessages,
} from '@web/lib/messages';
import type { Chat as ChatType, ParsedMessage } from '@web/lib/types';
import {
  createMessageObject,
  fileToIFile,
  messageToAPIMessage,
} from '@web/lib/utils/message';
import { sendMessage } from '@web/services';
import {
  Copy,
} from 'lucide-react';
import { type Dispatch, type SetStateAction, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { ClientUploadedFileData } from 'uploadthing/types';
import { type ModelId } from '@server/utils/models';
import { useChatScroll } from '../../hooks/use-chat-scroll';
import { ChatFooter } from './footer';
import { UserMessage } from '../message';

type ChatProps = {
  chat: ChatType;
  messages?: ParsedMessage[];
  areMessagesLoading?: boolean;
  onSubmit?: (message: string) => void;
  setParsedMessages: Dispatch<SetStateAction<ParsedMessage[]>>;
};

export function Chat({
  chat,
  messages = [],
  areMessagesLoading = false,
  onSubmit,
  setParsedMessages,
}: ChatProps) {
  const user = useUser();
  const navigate = useNavigate();
  const params = useParams({ from: '/_chat' });
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { scrollToBottom, scrollToBottomButtonRef, scrollToBottomElRef } = useChatScroll({
    chatId: chat?.id ?? '',
    areMessagesLoading,
  });
  const [isCopying, setIsCopying] = useState(false);

  const handleNewMessage = async (
    message: string,
    files: ClientUploadedFileData<null>[],
    webSearchEnabled: boolean,
    reasoning: 'off' | 'low' | 'medium' | 'high',
  ) => {
    if (!user.data) return;
    if (onSubmit) {
      onSubmit(message);
      return;
    }
    if (chat) {
      // the latest message if from the assistant
      const messages = await getChatMessages(chat.id);
      const previousResponseId = messages[messages.length - 1]?.responseId;
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
      await db.transact([
        ...ifiles.map(file => db.tx.files[file.id].update(file)),
        userMessageTx.link({ files: ifiles.map(file => file.id) }),
        assistantMessageTx,
        db.tx.chats[chat.id]!.update({
          updatedAt: new Date().toISOString(),
        }),
      ]);

      const messagesForApi = messages.map(m => messageToAPIMessage(m));
      messagesForApi.push(messageToAPIMessage(newUserMessage));
      await sendMessage({
        messages: messagesForApi,
        userId: user.data.id,
        messageId: newAssistantMessage.id,
        previousResponseId,
        model: chat.model,
        chatId: chat.id,
        webSearchEnabled,
        reasoning,
      });
    }
  };

  const handleCopyChat = async () => {
    if (!user.data || !chat || isCopying) return;

    setIsCopying(true);
    try {
      const newChatId = await copySharedChat(chat, user.data, messages);
      navigate({ to: '/$chatId', params: { chatId: newChatId } });
      toast.success('Chat copied to your account!');
    } catch (error) {
      console.error('Failed to copy chat:', error);
      toast.error('Failed to copy chat');
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <>
      <div className='flex h-full flex-col overflow-hidden'>
        <div
          ref={messagesContainerRef}
          className='chat-scrollbar h-dvh overflow-y-auto'
        >
          <div className='mx-auto mt-4 mb-10 max-w-3xl space-y-4 px-4'>
            {messages.map(m => <UserMessage key={m.id} message={m} chat={chat} isProcessing={isProcessing} user={user} />)}
          </div>
          <div ref={scrollToBottomElRef} id='scroll' className='h-40 w-full' />
        </div>
      </div>
      <div className='absolute bottom-0 w-full px-2'>
        <Button
          ref={scrollToBottomButtonRef}
          className='mx-auto block mb-2 invisible'
          onClick={() => scrollToBottom('instant')}
        >
          Scroll to bottom
        </Button>
        {'shareToken' in params ? (
          <div className='flex h-16 w-full mobile-safe-bottom items-center justify-center'>
            <Button onClick={handleCopyChat} disabled={isCopying}>
              <Copy className='h-4 w-4' />
              Copy Chat
            </Button>
          </div>
        ) : (
          <ChatFooter
            onSubmit={handleNewMessage}
            selectedModel={chat.model as ModelId}
            updateModel={model => updateChatModel(chat, model)}
            lastMessage={messages[messages.length - 1]}
          />
        )}
      </div>
    </>
  );
}
