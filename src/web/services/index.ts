import type { ModelId } from '@server/utils/models';
import type { Body } from '@server/types';

export async function sendMessage({
  messages,
  userId,
  messageId,
  model,
  chatId,
}: {
  messages: Body['messages'];
  userId: string;
  messageId: string;
  model: ModelId;
  chatId: string;
}) {
  const body = {
    messages,
    config: {
      model,
      userId,
      chatId,
      messageId,
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

export async function deleteFile(fileKey: string) {
  await fetch(`/api/storage/${fileKey}`, {
    method: 'DELETE',
  });
}
