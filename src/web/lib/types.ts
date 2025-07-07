import type { InstaQLEntity } from '@instantdb/core';
import type { ModelId } from '@server/utils/models';
import type schema from '../../../instant.schema';

export type Chat = Omit<InstaQLEntity<typeof schema, 'chats'>, 'model'> & {
  model: ModelId;
};
export type IFile = InstaQLEntity<typeof schema, 'files'>;
export type Message = Omit<InstaQLEntity<typeof schema, 'messages'>, 'role'> & {
  files?: IFile[];
  role: 'user' | 'assistant' | 'system' | 'tool';
};
export type ParsedMessage = Message & {
  highlightedText?: string;
  highlightedReasoning?: string;
};

export type Project = InstaQLEntity<typeof schema, 'projects'> & {
  chats?: Chat[];
};

export type AttachmentFile = {
  key: string;
  name: string;
  type: string;
  ufsUrl: string | null;
};
