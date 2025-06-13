import {
  generateUploadButton,
  generateUploadDropzone,
} from '@uploadthing/react';
import { generateReactHelpers } from '@uploadthing/react';
import type { OurFileRouter } from '@server/uploadrouter';

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();

export const { useUploadThing, uploadFiles } =
  generateReactHelpers<OurFileRouter>();
