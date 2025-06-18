import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

export const renameChat = async ({
  message,
  apiKey,
}: {
  message: string;
  apiKey: string;
}) => {
  const openrouter = createOpenRouter({
    apiKey,
  });

  const response = await generateText({
    model: openrouter('google/gemma-2-9b-it'),
    prompt: `Using this message as context, I need you to generate a title for a chat. The title should be a short. The title should not be longer than 10 words. Please generate the title only, without any additional explanation or context. Do not include any other text or information in your response. The title should be in the format of a sentence, starting with a capital letter, should only include letters in the alphabet and spaces, do not add special characters. Use the same language the message was written in. Here is the message: ${message}`,
  });
  const text = response.text;
  return text;
};
