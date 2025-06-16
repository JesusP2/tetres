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
    return node.children
      .map(child => extractTextFromNodes(child))
      .join('');
  }
  
  return '';
}
