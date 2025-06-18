import { id } from '@instantdb/core';
import type { MyUser } from '@web/hooks/use-user';
import { renameChat, sendMessage } from '@web/services';
import type { ClientUploadedFileData } from 'uploadthing/types';
import type { ModelId } from '@server/utils/models';
import { createChat } from './chats';
import { db } from './instant';
import { createAssistantMessage, createUserMessage } from './messages';
import {
  createMessageObject,
  fileToIFile,
  messageToAPIMessage,
} from './utils/message';

export const handleCreateChat = async (
  newChatId: string,
  messageContent: string,
  files: ClientUploadedFileData<null>[],
  webSearchEnabled: boolean,
  reasoning: 'off' | 'low' | 'medium' | 'high',
  user: MyUser,
  ui: {
    id: string;
    defaultModel: ModelId;
  } | null,
  projectId?: string,
) => {
  if (!user.data || !ui || !window.navigator.onLine) return;
  const chatTx = createChat(
    user.data,
    'New Chat',
    newChatId,
    ui.defaultModel,
    undefined,
    projectId,
  );
  const userMessage = createMessageObject({
    role: 'user',
    content: messageContent,
    model: ui.defaultModel,
    chatId: newChatId,
    finished: new Date().toISOString(),
    files: files.map(file => fileToIFile(file, newChatId)),
  });
  const assistantMessage = createMessageObject({
    role: 'assistant',
    content: {},
    model: ui.defaultModel,
    chatId: newChatId,
  });
  const userMessageTx = createUserMessage(userMessage);
  const assistantMessageTx = createAssistantMessage(assistantMessage);
  const ifiles = files.map(file => fileToIFile(file, newChatId));
  await db.transact([
    ...ifiles.map(file => db.tx.files[file.id].update(file)),
    chatTx,
    userMessageTx.link({ files: ifiles.map(file => file.id) }),
    assistantMessageTx,
  ]);

  const apiMessage = messageToAPIMessage(userMessage);
  await Promise.all([
    renameChat(newChatId, messageContent),
    sendMessage({
      messages: [apiMessage],
      userId: user.data.id,
      messageId: assistantMessage.id,
      model: ui.defaultModel,
      chatId: userMessage.chatId,
      webSearchEnabled,
      reasoning,
    }),
  ]);
  return newChatId;
};
