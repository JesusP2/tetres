import { createUploadthing, type FileRouter } from 'uploadthing/server';

const f = createUploadthing();

export const uploadRouter = {
  uploader: f({
    image: {
      maxFileSize: '8MB',
      maxFileCount: 1,
    },
    pdf: {
      maxFileSize: '8MB',
      maxFileCount: 1,
    },
  }).onUploadComplete(data => {
    console.log('upload completed', data);
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
