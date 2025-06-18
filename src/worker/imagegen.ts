import OpenAI from 'openai';
import { ResponseInputImage } from 'openai/resources/responses/responses.mjs';
import { UTApi } from 'uploadthing/server';
import { z } from 'zod/v4';
import { coreUserMessageSchema } from './schemas';
import { Body } from './types';

export async function generateImage(
  filteredMessages: Body['messages'],
  OPENAI_API_KEY: string,
  UPLOADTHING_TOKEN: string,
) {
  const lastMessage = filteredMessages[filteredMessages.length - 1] as z.infer<
    typeof coreUserMessageSchema
  >;
  const messageContent = lastMessage.content.map(part => {
    if (part.type === 'image') {
      // TODO: transform url to base64
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
  for (const output of response.output) {
    if (output.type === 'image_generation_call') {
      const file_ext = output.output_format;
      const base64 = output.result;
      // TODO: upload to uploadthing
    }
  }
  // TODO: add support for image generation
}
