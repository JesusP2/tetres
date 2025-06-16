import { fromAsyncCodeToHtml } from '@shikijs/markdown-it/async';
import MarkdownItAsync from 'markdown-it-async';
import { codeToHtml } from 'shiki';
// import everforestLight from 'tm-themes/themes/everforest-light.json';
// import everforestDark from 'tm-themes/themes/everforest-dark.json';
// import kanagawaLotus from 'tm-themes/themes/kanagawa-lotus.json';
// import kanagawaWave from 'tm-themes/themes/kanagawa-wave.json';
import minLight from 'tm-themes/themes/min-light.json';
import minDark from 'tm-themes/themes/min-dark.json';

const md = MarkdownItAsync();
md.use(
  fromAsyncCodeToHtml(codeToHtml, {
    themes: {
      light: minLight,
      dark: minDark,
      // kanagawaLotus,
      // kanagawaWave,
      // everforestLight,
      // everforestDark,
    },
    transformers: [
      {
        pre(node) {
          const language = this.options.lang;
          const languageNames: Record<string, string> = {
            js: 'JavaScript',
            javascript: 'JavaScript',
            ts: 'TypeScript',
            typescript: 'TypeScript',
            jsx: 'React JSX',
            tsx: 'React TSX',
            html: 'HTML',
            css: 'CSS',
            scss: 'SCSS',
            sass: 'Sass',
            less: 'Less',
            json: 'JSON',
            yaml: 'YAML',
            yml: 'YAML',
            xml: 'XML',
            markdown: 'Markdown',
            md: 'Markdown',
            bash: 'Bash',
            shell: 'Shell',
            sh: 'Shell',
            python: 'Python',
            py: 'Python',
            java: 'Java',
            c: 'C',
            cpp: 'C++',
            csharp: 'C#',
            php: 'PHP',
            ruby: 'Ruby',
            go: 'Go',
            rust: 'Rust',
            swift: 'Swift',
            kotlin: 'Kotlin',
            dart: 'Dart',
            sql: 'SQL',
            graphql: 'GraphQL',
            dockerfile: 'Dockerfile',
            nginx: 'Nginx',
            apache: 'Apache',
            text: 'Plain Text',
            txt: 'Plain Text',
          };

          const displayName =
            languageNames[language.toLowerCase()] || language.toUpperCase();

          const copyButton = {
            type: 'element' as const,
            tagName: 'button',
            properties: {
              class: 'copy-button',
              onclick: `
                  const btn = this;
                  const code = this.parentElement.nextElementSibling.textContent;
                  navigator.clipboard.writeText(code).then(() => {
                    btn.classList.add('copied');
                    setTimeout(() => btn.classList.remove('copied'), 2000);
                  }).catch(() => {
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = code;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    btn.classList.add('copied');
                    setTimeout(() => btn.classList.remove('copied'), 2000);
                  });
                `,
              type: 'button',
              'aria-label': 'Copy code to clipboard',
              title: 'Copy code',
            },
            children: [
              {
                type: 'text' as const,
                value: 'replace-text-with-icons',
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
              'replace-text-with-icons',
              `<span class="copy-icon">
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                   <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                   <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                 </svg>
               </span>
               <span class="check-icon">
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                   <path d="M20 6 9 17l-5-5"/>
                 </svg>
               </span>`,
            );
          },
      },
    ],
  }),
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
