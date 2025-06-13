import type { InstaQLEntity } from '@instantdb/core';
import type schema from '../../../instant.schema';

export type Chat = InstaQLEntity<typeof schema, 'chats'>;
export type IFile = InstaQLEntity<typeof schema, 'files'>;
export type Message = Omit<InstaQLEntity<typeof schema, 'messages'>, 'role'> & {
  files?: IFile[];
  role: 'user' | 'assistant' | 'system' | 'tool';
};
