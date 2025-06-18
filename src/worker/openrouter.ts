import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { AppBindings, Body } from "./types";
import { streamText } from "ai";

export const sendMessageToOpenrouter = async ({
  messages,
  config,
  db,
  apiKey,
}: {
  messages: Body['messages'];
  config: Body['config'];
  db: AppBindings['Variables']['db'];
  apiKey: string;
}) => {
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
  let compoundedTime = 0;
  let last = new Date().getTime();
  const response = streamText({
    model: openrouter(model, settings),
    messages,
    onChunk: async ({ chunk }) => {
      compoundedTime += new Date().getTime() - last;
      const message = await db.query({
        messages: {
          $: {
            where: {
              id: messageId,
            },
          },
        },
      });
      if (message.messages[0].aborted) {
        // await db.transact(
        //   db.tx.messages[messageId].update({
        //     finished: new Date().toISOString(),
        //   }),
        // );
        throw new Error('aborted');
      }
      if (chunk.type === 'reasoning') {
        const text = chunk.textDelta;
        await db
          .transact(
            db.tx.messages[messageId].merge({
              reasoning: {
                [sqId]: text,
              },
            }),
          )
          .catch(console.error);
      } else if (chunk.type === 'text-delta') {
        const text = chunk.textDelta;
        await db
          .transact(
            db.tx.messages[messageId].merge({
              content: {
                [sqId]: text,
              },
            }),
          )
          .catch(console.error);
      }
      sqId++;
      last = new Date().getTime();
    },
  });
  await response.consumeStream();
  const usage = await response.usage;
  const update = {
    finished: new Date().toISOString(),
    time: compoundedTime,
    tokens: usage.completionTokens,
  };
  await db.transact(db.tx.messages[messageId].update(update));
};

