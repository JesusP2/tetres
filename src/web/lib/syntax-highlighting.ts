import { fromAsyncCodeToHtml } from '@shikijs/markdown-it/async';
import MarkdownItAsync from 'markdown-it-async';
import { codeToHtml } from 'shiki';

const md = MarkdownItAsync();
md.use(
  fromAsyncCodeToHtml(
    codeToHtml,
    {
      themes: {
        light: 'catppuccin-frappe',
        dark: 'catppuccin-mocha',
      },
      transformers: [
        {
          pre(node) {
            const language = this.options.lang;
            const languageNames: Record<string, string> = {
              'js': 'JavaScript',
              'javascript': 'JavaScript',
              'ts': 'TypeScript',
              'typescript': 'TypeScript',
              'jsx': 'React JSX',
              'tsx': 'React TSX',
              'html': 'HTML',
              'css': 'CSS',
              'scss': 'SCSS',
              'sass': 'Sass',
              'less': 'Less',
              'json': 'JSON',
              'yaml': 'YAML',
              'yml': 'YAML',
              'xml': 'XML',
              'markdown': 'Markdown',
              'md': 'Markdown',
              'bash': 'Bash',
              'shell': 'Shell',
              'sh': 'Shell',
              'python': 'Python',
              'py': 'Python',
              'java': 'Java',
              'c': 'C',
              'cpp': 'C++',
              'csharp': 'C#',
              'php': 'PHP',
              'ruby': 'Ruby',
              'go': 'Go',
              'rust': 'Rust',
              'swift': 'Swift',
              'kotlin': 'Kotlin',
              'dart': 'Dart',
              'sql': 'SQL',
              'graphql': 'GraphQL',
              'dockerfile': 'Dockerfile',
              'nginx': 'Nginx',
              'apache': 'Apache',
              'text': 'Plain Text',
              'txt': 'Plain Text',
            };

            const displayName = languageNames[language.toLowerCase()] || language.toUpperCase();
            console.log(language, displayName);

            const copyButton = {
              type: 'element' as const,
              tagName: 'button',
              properties: {
                class: 'copy-button',
                onclick: `navigator.clipboard.writeText(this.parentElement.nextElementSibling.textContent)`,
                type: 'button',
                'aria-label': 'Copy code to clipboard',
                title: 'Copy code',
              },
              children: [
                {
                  type: 'text' as const,
                  value: 'replace-text-with-copy-icon',
                },
              ],
            };

            const codeBadge = {
              type: 'element' as const,
              tagName: 'div',
              properties: {
                class: 'language-badge',
              },
              children: [
                {
                  type: 'element' as const,
                  tagName: 'span',
                  properties: {
                    class: 'language-name',
                  },
                  children: [
                    {
                      type: 'text' as const,
                      value: displayName,
                    },
                  ],
                },
                copyButton,
              ],
            };

            return {
              type: 'element' as const,
              tagName: 'div',
              properties: {
                class: 'pre-container',
              },
              children: [
                codeBadge,
                {
                  ...node,
                  properties: {
                    ...node.properties,
                    class: `${node.properties?.class || ''} actual-code`.trim(),
                  },
                },
              ],
            };
          },
          postprocess(html: string) {
            return html.replace(
              'replace-text-with-copy-icon',
              '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy h-3 w-3"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>',
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

// Type definitions for the node structure
interface TextNode {
  type: 'text';
  value: string;
}

interface ElementNode {
  type: 'element';
  tagName: string;
  properties?: Record<string, any>;
  children?: (TextNode | ElementNode)[];
}

type Node = TextNode | ElementNode;

/**
 * Recursively extracts all text values from a node structure
 * @param node - The root node to extract text from
 * @returns Concatenated string of all text values
 */
export function extractTextFromNodes(node: Node): string {
  if (node.type === 'text') {
    return node.value;
  }

  if (node.type === 'element' && node.children) {
    return node.children.map(child => extractTextFromNodes(child)).join('');
  }

  return '';
}
