import { objectToString } from '@web/hooks/use-chat-messages';
import { db } from './instant';
import type { Chat } from './types';

export async function handleExportChat(chat: Chat) {
  const chatAndMessages = await db.queryOnce({
    messages: {
      $: {
        where: {
          chatId: chat.id,
        },
        order: {
          updatedAt: 'asc',
        },
      },
      files: {},
    },
  });
  const messages = chatAndMessages.data?.messages;
  if (!messages) return;

  let markdown = `# ${chat.title}\n`;
  markdown += `Created: ${new Date(chat.createdAt).toLocaleString()}\n`;
  markdown += `Last Updated: ${new Date(chat.updatedAt).toLocaleString()}\n`;
  markdown += '---\n\n';

  for (const message of messages) {
    if (message.role !== 'user' && message.role !== 'assistant') {
      continue;
    }

    let roleHeader =
      message.role.charAt(0).toUpperCase() + message.role.slice(1);
    if (message.role === 'assistant' && message.model) {
      roleHeader += ` (${message.model})`;
    }
    markdown += `### ${roleHeader}\n\n`;

    if (message.role === 'assistant' && message.reasoning) {
      const reasoningContent = objectToString(message.reasoning);
      if (reasoningContent.trim()) {
        markdown += `<details>\n<summary>Reasoning</summary>\n\n${reasoningContent}\n\n</details>\n\n`;
      }
    }

    const content = objectToString(message.content);
    markdown += `${content}\n\n`;

    if (message.files && message.files.length > 0) {
      for (const file of message.files) {
        markdown += `![${file.name}](${file.ufsUrl})\n\n`;
      }
    }
    markdown += '---\n\n';
  }

  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${chat.title.replace(/[\\/:"*?<>|]/g, '_')}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
