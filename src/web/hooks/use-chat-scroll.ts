import { useEffect, useRef, useState } from 'react';

export function useChatScroll({
  chatId,
  messagesContainerRef,
  messages,
}: {
  chatId: string;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  messages: any[];
}) {
  const [showScrollButton, setShowScrollButton] = useState(false);
  const isAtBottomRef = useRef(true);

  const isAtBottom = (el: HTMLElement) => {
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  };

  const scrollToBottom = (behavior: 'smooth' | 'instant' = 'smooth') => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const atBottom = isAtBottom(el);
      isAtBottomRef.current = atBottom;
      setShowScrollButton(!atBottom);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
    };
  }, [messagesContainerRef]);

  useEffect(() => {
    if (chatId) {
      scrollToBottom('instant');
    }
  }, [chatId]);

  useEffect(() => {
    if (isAtBottomRef.current) {
      scrollToBottom('smooth');
    }
  }, [messages, messages.length]);

  return { showScrollButton, scrollToBottom };
} 
