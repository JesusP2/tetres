import { useEffect, useRef } from 'react';

export function useChatScroll({
  chatId,
  messagesContainerRef,
  areMessagesLoading,
}: {
  chatId: string;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
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
    console.log('areMessagesLoading', areMessagesLoading);
    if (!areMessagesLoading) {
      console.log('scroll to bottom', messagesContainerRef.current);
        scrollToBottom('instant');
    }
  }, [chatId, areMessagesLoading]);

  useEffect(() => {
    if (!scrollToBottomElRef.current) return;
    const observer = new IntersectionObserver(entries => {
      const entry = entries[0];
      console.log(
        'entry',
        entry?.isIntersecting,
        areMessagesLoading,
        scrollToBottomButtonRef.current,
      );
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
