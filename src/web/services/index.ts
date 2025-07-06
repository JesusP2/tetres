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
  previousResponseId,
}: {
  messages: Body['messages'];
  userId: string;
  messageId: string;
  model: ModelId;
  chatId: string;
  webSearchEnabled: boolean;
  reasoning: 'off' | 'low' | 'medium' | 'high';
  previousResponseId?: string;
}) {
  const body = {
    messages,
    config: {
      model,
      userId,
      chatId,
      messageId,
      web: webSearchEnabled,
      previousResponseId,
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

export async function renameChat(chatId: string, message: string) {
  const body = {
    chatId,
    message,
  };
  await fetch('/api/rename-chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

export async function addKey(provider: string, apiKey: string) {
  const response = await fetch('/api/user-keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, apiKey }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add API key');
  }
}

export async function sendAudio(audioBlob: Blob) {
  const formData = new FormData();
  const audioFile = new File([audioBlob], `audio_${Date.now()}.wav`, {
    type: audioBlob.type || 'audio/wav',
  });

  formData.append('audio', audioFile);
  formData.append('timestamp', new Date().toISOString());

  const response = await fetch('/api/audio', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || 'Failed to send audio');
  }

  const data = await response.json();
  return data.transcription;
}

export async function abortRequest(messageId: string) {
  await fetch(`/api/model/${messageId}`, {
    method: 'POST',
  });
}
