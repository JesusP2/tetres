import { fromAsyncCodeToHtml } from '@shikijs/markdown-it/async';
import MarkdownItAsync from 'markdown-it-async';
import { codeToHtml } from 'shiki';

const md = MarkdownItAsync();
md.use(
  fromAsyncCodeToHtml(
    // Pass the codeToHtml function
    codeToHtml,
    {
      themes: {
        light: 'catppuccin-frappe',
        dark: 'catppuccin-mocha',
        // light: 'github-light',
        // dark: 'github-dark',
      },
      transformers: [
        {
          pre(node) {
            const codeTag = node.children
              .filter(assumeIsAnElement)
              .find(
                element => 'tagName' in element && element.tagName === 'code',
              );
            if (codeTag == null || !('properties' in codeTag)) {
              console.warn('could not find code tag inside the pre element');
              return node;
            }
            const languageProperty = codeTag.properties.class;
            if (
              languageProperty == null ||
              typeof languageProperty !== 'string'
            ) {
              console.warn(
                'could not find class for codeTag that should represent its language',
                languageProperty,
              );
              return node;
            }
            const languagePrefix = 'language-';
            if (!languageProperty.startsWith(languagePrefix)) {
              console.warn(
                'the found class does not represent a language',
                languageProperty,
              );
              return node;
            }

            const language = languageProperty.replace(languagePrefix, '');
            const copyButton = {
              type: 'element',
              tagName: 'button',
              properties: {
                class:
                  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 disabled:hover:bg-transparent disabled:hover:text-foreground/50 text-xs size-8 rounded-lg p-2 text-secondary-foreground transition-colors hover:bg-muted-foreground/10 hover:text-muted-foreground dark:hover:bg-muted-foreground/5',
              },
              children: [
                {
                  type: 'text',
                  value: 'replace-text-with-copy-icon',
                },
              ],
            };

            const codeBadge = {
              type: 'element',
              tagName: 'div',
              properties: {
                class: 'language-badge',
              },
              children: [
                {
                  type: 'element',
                  tagName: 'span',
                  children: [
                    {
                      type: 'text',
                      value: language,
                    },
                  ],
                },
                copyButton,
              ],
            };
            console.log(JSON.stringify(node));
            return {
              type: 'element',
              tagName: 'div',
              properties: {
                class: 'pre-container',
                onclick: '',
              },
              children: [
                codeBadge,
                {
                  ...node,
                  properties: {
                    ...node.properties,
                    class: 'actual-code',
                  },
                },
              ],
            };
          },
          postprocess(html: string) {
            return html.replace(
              'replace-text-with-copy-icon',
              '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy h-3 w-3"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>',
            );
          },
        },
      ],
    },
  ),
);

export async function renderMarkdown(input: string) {
  const html = await md.renderAsync(input);
  return html;
}
const assumeIsAnElement = (element: ElementContent): element is Element => {
  return element != null && element.type === 'element';
};
// ('shiki not-prose relative bg-chat-accent text-sm font-[450] text-secondary-foreground [&_pre]:overflow-auto [&_pre]:!bg-transparent [&_pre]:px-[1em] [&_pre]:py-[1em] [&_pre]:whitespace-pre-wrap');

// ('shiki not-prose relative bg-chat-accent text-sm font-[450] text-secondary-foreground [&_pre]:overflow-auto [&_pre]:!bg-transparent [&_pre]:px-[1em] [&_pre]:py-[1em]');
