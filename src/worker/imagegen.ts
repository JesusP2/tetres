import { id } from '@instantdb/core';
import OpenAI from 'openai';
import { ResponseInputImage } from 'openai/resources/responses/responses.mjs';
import { UTApi } from 'uploadthing/server';
import { UploadedFileData } from 'uploadthing/types';
import { z } from 'zod/v4';
import { coreUserMessageSchema } from './schemas';
import { AppBindings, Body } from './types';

export async function generateImage({
  filteredMessages,
  OPENAI_API_KEY,
  UPLOADTHING_TOKEN,
  db,
  messageId,
  chatId,
  previousResponseId,
}: {
  filteredMessages: Body['messages'];
  OPENAI_API_KEY: string;
  UPLOADTHING_TOKEN: string;
  db: AppBindings['Variables']['db'];
  messageId: string;
  chatId: string;
  previousResponseId?: string;
}) {
  try {
    const lastMessage = filteredMessages[
      filteredMessages.length - 1
    ] as z.infer<typeof coreUserMessageSchema>;
    const messageContent = lastMessage.content.map(part => {
      if (part.type === 'image') {
        return {
          type: 'input_image',
          image_url: part.image,
        };
      } else if (part.type === 'text') {
        return {
          type: 'input_text',
          text: part.text,
        };
      }
      throw new Error('File upload not supported');
    }) as ResponseInputImage[];
    if (lastMessage.role !== 'user') {
      throw new Error('Last message is not a user message');
    }
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });

    const response = await openai.responses.create({
      model: 'gpt-4.1-mini',
      previous_response_id: previousResponseId,
      input: [
        {
          role: 'user',
          content: messageContent,
        },
      ],
      tools: [{ type: 'image_generation' }],
    });

    const utapi = new UTApi({
      token: UPLOADTHING_TOKEN,
    });
    const responseId = response.id;
    const message = response.output_text;
    const uploadedImages: (UploadedFileData & { id: string })[] = [];

    for (const output of response.output) {
      if (output.type === 'image_generation_call') {
        const file_ext = (output as any).output_format || 'png';
        const base64 = output.result;
        if (!base64) {
          console.warn('No base64 data found in image generation output');
          continue;
        }

        // Convert base64 to Blob
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: `image/${file_ext}` });

        // Create File from Blob
        const filename = `generated_image_${Date.now()}.${file_ext}`;
        const file = new File([blob], filename, { type: `image/${file_ext}` });
        const uploadResult = await utapi.uploadFiles([file]);
        const uploadedFile = uploadResult[0];

        if (uploadedFile && !uploadedFile.error) {
          uploadedImages.push({
            ...uploadedFile.data,
            id: id(),
          });
        }
      }
    }
    const storedMessage = await db.query({
      messages: {
        $: {
          where: {
            id: messageId,
          },
        },
      },
    });
    if (storedMessage.messages[0].aborted) {
      return;
    }
    const fileTxs = uploadedImages.map(image => {
      return db.tx.files[image.id].update({
        name: image.name,
        size: image.size,
        type: image.type,
        key: image.key,
        ufsUrl: image.ufsUrl,
        fileHash: image.fileHash,
        chatId,
      });
    });
    await db.transact([
      ...fileTxs,
      db.tx.messages[messageId]
        .update({
          responseId,
          content: message,
          finished: new Date().toISOString(),
        })
        .link({ files: uploadedImages.map(image => image.id) }),
    ]);
  } catch (err) {
    console.error(err);
    await db.transact(
      db.tx.messages[messageId].update({
        aborted: new Date().toISOString(),
        finished: new Date().toISOString(),
      }),
    );
  }
}
