import type { Body } from '@server/types';
import type { ModelId } from '@server/utils/models';

export async function sendMessage({
  messages,
  userId,
  messageId,
  model,
  chatId,
  webSearchEnabled,
  reasoning,
}: {
  messages: Body['messages'];
  userId: string;
  messageId: string;
  model: ModelId;
  chatId: string;
  webSearchEnabled: boolean;
  reasoning: 'off' | 'low' | 'medium' | 'high';
}) {
  const body = {
    messages,
    config: {
      model,
      userId,
      chatId,
      messageId,
      web: webSearchEnabled,
      reasoning,
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
