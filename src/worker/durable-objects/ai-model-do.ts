import { id } from '@instantdb/core';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';
import { generateText } from 'ai';
import { DurableObject, env } from 'cloudflare:workers';
import OpenAI, { APIUserAbortError } from 'openai';
import { ResponseInputImage } from 'openai/resources/responses/responses.mjs';
import { UTApi } from 'uploadthing/server';
import { UploadedFileData } from 'uploadthing/types';
import { z } from 'zod/v4';
import { getDb } from '@server/db';
import { coreUserMessageSchema } from '@server/schemas';
import { AppBindings, Body } from '@server/types';

type Bindings = typeof env;
export class AIModelDurableObject extends DurableObject {
  private activeRequests: Map<string, AbortController> = new Map();
  private db: AppBindings['Variables']['db'];
  constructor(ctx: DurableObjectState, _env: Bindings) {
    super(ctx, _env);
    this.db = getDb(_env);
  }

  async cancelRequest(messageId: string) {
    console.log(this.activeRequests.get(messageId));
    this.activeRequests.get(messageId)?.abort();
  }

  // NOTE: it doesnt need to be in a DO but idc
  async renameChat({
    message,
    chatId,
    apiKey,
  }: {
    message: string;
    chatId: string;
    apiKey: string;
  }) {
    const openrouter = createOpenRouter({
      apiKey,
    });

    const response = await generateText({
      model: openrouter('google/gemma-2-9b-it'),
      prompt: `Using this message as context, I need you to generate a title for a chat. The title should be a short. The title should not be longer than 10 words. Please generate the title only, without any additional explanation or context. Do not include any other text or information in your response. The title should be in the format of a sentence, starting with a capital letter, should only include letters in the alphabet and spaces, do not add special characters. Use the same language the message was written in. Here is the message: ${message}`,
    });
    const text = response.text;
    await this.db.transact(
      this.db.tx.chats[chatId].update({
        title: text,
        updatedAt: new Date().toISOString(),
      }),
    );
  }

  async generateImage({
    filteredMessages,
    OPENAI_API_KEY,
    UPLOADTHING_TOKEN,
    messageId,
    chatId,
    previousResponseId,
  }: {
    filteredMessages: Body['messages'];
    OPENAI_API_KEY: string;
    UPLOADTHING_TOKEN: string;
    messageId: string;
    chatId: string;
    previousResponseId?: string;
  }) {
    try {
      this.activeRequests.set(messageId, new AbortController());
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

      const response = await openai.responses.create(
        {
          model: 'gpt-4.1-mini',
          previous_response_id: previousResponseId,
          input: [
            {
              role: 'user',
              content: messageContent,
            },
          ],
          tools: [{ type: 'image_generation', quality: 'low' }],
        },
        {
          signal: this.activeRequests.get(messageId)?.signal,
        },
      );

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
          const file = new File([blob], filename, {
            type: `image/${file_ext}`,
          });
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
      const fileTxs = uploadedImages.map(image => {
        return this.db.tx.files[image.id].update({
          name: image.name,
          size: image.size,
          type: image.type,
          key: image.key,
          ufsUrl: image.ufsUrl,
          fileHash: image.fileHash,
          chatId,
        });
      });
      await this.db.transact([
        ...fileTxs,
        this.db.tx.messages[messageId]
          .update({
            responseId,
            content: message,
            finished: new Date().toISOString(),
          })
          .link({ files: uploadedImages.map(image => image.id) }),
      ]);
      this.activeRequests.delete(messageId);
    } catch (err) {
      await this.db
        .transact(
          this.db.tx.messages[messageId].update({
            aborted:
              err instanceof APIUserAbortError
                ? new Date().toISOString()
                : null,
            finished: new Date().toISOString(),
          }),
        )
        .catch(console.error);
      this.activeRequests.delete(messageId);
    }
  }

  async sendMessageToOpenrouter({
    messages,
    config,
    apiKey,
  }: {
    messages: Body['messages'];
    config: Body['config'];
    apiKey: string;
  }) {
    this.activeRequests.set(config.messageId, new AbortController());
    try {
      const openrouter = createOpenRouter({
        apiKey,
      });
      let model: string = config.model;
      if (config.web) {
        model = `${config.model}:online`;
      }
      const settings: {
        reasoning?: {
          effort: 'low' | 'medium' | 'high';
        };
      } = {};
      if (config.reasoning !== 'off') {
        settings.reasoning = {
          effort: config.reasoning,
        };
      }

      const messageId = config.messageId;
      let sqId = 0;
      const start = new Date();
      const response = streamText({
        model: openrouter(model, settings),
        abortSignal: this.activeRequests.get(config.messageId)?.signal,
        messages,
        onChunk: async ({ chunk }) => {
          if (chunk.type === 'reasoning') {
            const text = chunk.textDelta;
            await this.db
              .transact(
                this.db.tx.messages[messageId].merge({
                  reasoning: {
                    [sqId]: text,
                  },
                }),
              )
              .catch(console.error);
          } else if (chunk.type === 'text-delta') {
            const text = chunk.textDelta;
            await this.db
              .transact(
                this.db.tx.messages[messageId].merge({
                  content: {
                    [sqId]: text,
                  },
                }),
              )
              .catch(console.error);
          }
          sqId++;
        },
      });
      await response.consumeStream();
      if (this.activeRequests.get(config.messageId)?.signal.aborted) {
        await this.db.transact(
          this.db.tx.messages[messageId].update({
            finished: new Date().toISOString(),
            aborted: new Date().toISOString(),
          }),
        );
        this.activeRequests.delete(config.messageId);
        return;
      }
      const usage = await response.usage;
      await this.db.transact(
        this.db.tx.messages[messageId].update({
          finished: new Date().toISOString(),
          time: new Date().getTime() - start.getTime(),
          tokens: usage.completionTokens,
        }),
      );
      this.activeRequests.delete(config.messageId);
    } catch (err) {
      console.error(err);
      await this.db.transact(
        this.db.tx.messages[config.messageId].update({
          finished: new Date().toISOString(),
        }),
      );
      this.activeRequests.delete(config.messageId);
    }
  }
}
