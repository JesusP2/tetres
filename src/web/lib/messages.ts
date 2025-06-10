import { InstaQLEntity } from '@instantdb/react';
import { db } from '@web/lib/instant';
import schema from '../../../instant.schema';

export type Message = InstaQLEntity<typeof schema, 'messages'>;

type CreateMessageInput = {
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
};

export async function sendMessage(
  messages: CreateMessageInput[],
  userId: string,
) {
  const lastMessage = messages[messages.length - 1];
  const body = {
    messages: messages.map(message => ({
      role: message.role,
      content: message.content,
    })),
    config: {
      model: 'google/gemini-2.5-flash-preview-05-20',
      userId,
      chatId: lastMessage.chatId,
    },
  };
  await fetch('/api/model', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

export async function saveMessage(
  newMessage: CreateMessageInput,
  id: string,
) {
  return db.transact(
    db.tx.messages[id]
      .update({
        ...newMessage,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .link({ chat: newMessage.chatId }),
  );
}

function editMessage(message: Message, newContent: string) {
  return db.transact(
    db.tx.messages[message.id].update({
      content: newContent,
      updatedAt: new Date().toISOString(),
    }),
  );
}

export function deleteMessage(message: Message) {
  return db.transact(db.tx.messages[message.id].delete());
}

export function deleteMessagesAfter(
  messages: Message[],
  targetMessage: Message,
) {
  const targetIndex = messages.findIndex(m => m.id === targetMessage.id);
  if (targetIndex === -1) return Promise.resolve();

  const messagesToDelete = messages.slice(targetIndex + 1);
  if (messagesToDelete.length === 0) return Promise.resolve();

  const deleteTransactions = messagesToDelete.map(message =>
    db.tx.messages[message.id].delete(),
  );

  return db.transact(deleteTransactions);
}

export async function retryMessage(
  messages: Message[],
  targetMessage: Message,
  newContent: string,
  userId: string,
) {
  console.log(messages, targetMessage, newContent, userId);
  await deleteMessagesAfter(messages, targetMessage);

  await editMessage(targetMessage, newContent);

  // Finally, regenerate the conversation from this point
  const targetIndex = messages.findIndex(m => m.id === targetMessage.id);
  const conversationUpToTarget = messages.slice(0, targetIndex + 1);

  const messagesForAPI = conversationUpToTarget.map(m => ({
    chatId: targetMessage.chatId,
    role: m.role as 'user' | 'assistant',
    content: m.id === targetMessage.id ? newContent : m.content,
  }));

  return sendMessage(messagesForAPI, userId);
}

export function copyMessageToClipboard(message: Message) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(message.content);
  } else {
    // Fallback for non-secure contexts
    const textArea = document.createElement('textarea');
    textArea.value = message.content;
    textArea.style.position = 'absolute';
    textArea.style.left = '-999999px';

    document.body.prepend(textArea);
    textArea.select();

    try {
      document.execCommand('copy');
    } catch (error) {
      console.error('Failed to copy text: ', error);
    } finally {
      textArea.remove();
    }

    return Promise.resolve();
  }
}
