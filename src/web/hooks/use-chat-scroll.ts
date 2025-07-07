import { useEffect, useRef } from 'react';

export function useChatScroll({
  chatId,
  areMessagesLoading,
}: {
  chatId: string;
  areMessagesLoading: boolean;
}) {
  const scrollToBottomButtonRef = useRef<HTMLButtonElement | null>(null);
  const scrollToBottomElRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = (behavior: 'smooth' | 'instant' = 'smooth') => {
    scrollToBottomElRef.current?.scrollIntoView({
      behavior,
    });
  };

  useEffect(() => {
    if (!areMessagesLoading) {
        scrollToBottom('instant');
    }
  }, [chatId, areMessagesLoading]);

  useEffect(() => {
    if (!scrollToBottomElRef.current) return;
    const observer = new IntersectionObserver(entries => {
      const entry = entries[0];
      if (entry?.isIntersecting) {
        scrollToBottomButtonRef.current?.classList.add('invisible');
      } else {
        scrollToBottomButtonRef.current?.classList.remove('invisible');
      }
    });

    observer.observe(scrollToBottomElRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);

  return { scrollToBottom, scrollToBottomButtonRef, scrollToBottomElRef };
}
