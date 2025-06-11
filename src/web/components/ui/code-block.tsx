import { useEffect, useState } from 'react';
import { codeToHtml } from 'shiki';

type CodeBlockProps = {
  code: string;
  lang: string;
  className?: string;
};

export function CodeBlock({ code, lang, className }: CodeBlockProps) {
  const [html, setHtml] = useState('');
  const [style, setStyle] = useState({});

  useEffect(() => {
    const highlight = async () => {
      const highlighter = await codeToHtml(code, {
        lang,
        themes: {
          light: 'github-light',
          dark: 'github-dark',
        },
      });
      const lightBg =
        /<pre class="shiki shiki-themes github-light" style="background-color:(.*?)"/.exec(
          highlighter,
        )?.[1];
      const darkBg =
        /<pre class="shiki shiki-themes github-dark" style="background-color:(.*?)"/.exec(
          highlighter,
        )?.[1];

      setHtml(highlighter);
      setStyle({
        '--shiki-light-bg': lightBg,
        '--shiki-dark-bg': darkBg,
      });
    };
    highlight();
  }, [code, lang]);

  return (
    <div
      style={style}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
