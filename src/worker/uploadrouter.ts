import { createUploadthing, type FileRouter } from 'uploadthing/server';

const f = createUploadthing();

export const uploadRouter = {
  uploader: f({
    image: {
      maxFileSize: '4MB',
      maxFileCount: 1,
    },
    pdf: {
      maxFileSize: '4MB',
      maxFileCount: 1,
    },
    'text/plain': {
      maxFileSize: '1MB',
    },
  }).onUploadComplete(data => {
    console.log('upload completed', data);
  }),
  avatarUploader: f({
    image: {
      maxFileSize: '1MB',
      maxFileCount: 1,
    },
  }).onUploadComplete(data => {
    console.log('upload completed', data);
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
