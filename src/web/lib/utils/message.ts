import { id } from '@instantdb/core';
import type { ClientUploadedFileData } from 'uploadthing/types';
import type { APIMessage, FilePart, ImagePart } from '@server/types';
import type { IFile, Message } from '../types';

export function messageToAPIMessage(message: Message): APIMessage {
  const apiMessage: APIMessage = {
    role: message.role,
    content:
      message.role === 'system'
        ? message.content
        : [
            {
              type: 'text',
              text: message.content,
            },
          ],
  };
  if (message.files) {
    for (const file of message.files) {
      // TODO: add the rest of roles
      if (apiMessage.role === 'user') {
        apiMessage.content.push(fileToAPIMessage(file));
      }
    }
  }
  return apiMessage;
}

export function fileToAPIMessage(file: ClientUploadedFileData<null> | IFile) {
  if (file.type.startsWith('image/')) {
    return {
      type: 'image',
      image: file.ufsUrl,
      mimeType: file.type,
    } as ImagePart;
  } else {
    return {
      type: 'file',
      data: file.ufsUrl,
      filename: file.name,
      mimeType: file.type,
    } as FilePart;
  }
}

export const fileToIFile = (
  file: ClientUploadedFileData<null>,
  chatId: string,
  _id?: string,
): IFile => ({
  id: _id || id(),
  name: file.name,
  size: file.size,
  type: file.type,
  key: file.key,
  ufsUrl: file.ufsUrl,
  fileHash: file.fileHash,
  chatId,
});

type Props = {
  role: Message['role'];
  chatId: Message['chatId'];
  content: Message['content'];
  model: Message['model'];
} & Partial<Message>;
export function createMessageObject(message: Props) {
  const obj = {
    id: id(),
    chatId: message.chatId,
    role: message.role,
    content: message.content,
    model: message.model,
    updatedAt: message.updatedAt || new Date().toISOString(),
    createdAt: message.createdAt || new Date().toISOString(),
  } as Message;
  if (message.finished) {
    obj.finished = message.finished;
  }
  if (message.files) {
    obj.files = message.files;
  }
  return obj;
}
