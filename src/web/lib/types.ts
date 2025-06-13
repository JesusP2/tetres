import type { InstaQLEntity } from '@instantdb/core';
import type { ClientUploadedFileData } from 'uploadthing/types';
import type schema from '../../../instant.schema';

export type Chat = InstaQLEntity<typeof schema, 'chats'>;
export type File = InstaQLEntity<typeof schema, '$files'> & {
  'content-disposition'?: string;
  'content-type': string;
};
export type Message = InstaQLEntity<typeof schema, 'messages'> & {
  files?: ClientUploadedFileData<null>[];
};
