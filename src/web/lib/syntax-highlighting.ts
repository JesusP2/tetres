import { fromAsyncCodeToHtml } from '@shikijs/markdown-it/async';
import MarkdownItAsync from 'markdown-it-async';
import { codeToHtml } from 'shiki';

// Or your custom shorthand bundle

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
    },
  ),
);

export async function renderMarkdown(input: string) {
  const html = await md.renderAsync(input);
  return html;
}
