import { fromAsyncCodeToHtml } from '@shikijs/markdown-it/async';
import MarkdownItAsync from 'markdown-it-async';
import { codeToHtml } from 'shiki';

// Custom transformer to add language label to code blocks
const addLanguageLabelTransformer = {
  name: 'add-language-label',
  pre(node: any) { // HAST Element node
    // Get the language from the node's class attribute
    const classNames = node.properties?.class || '';
    const langMatch = classNames.toString().match(/language-(\w+)/);
    
    if (langMatch) {
      const lang = langMatch[1];
      // Add data-lang attribute for CSS styling
      node.properties = node.properties || {};
      node.properties['data-lang'] = lang;
    }
  }
};

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
      transformers: [addLanguageLabelTransformer],
    },
  ),
);

export async function renderMarkdown(input: string) {
  const html = await md.renderAsync(input);
  return html;
}
