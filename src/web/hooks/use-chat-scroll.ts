import { useEffect, useRef, useState } from 'react';

function isScrolledToBottom(element: HTMLElement) {
  // Check if the element is scrolled to the bottom
  return (
    Math.abs(
      element.scrollHeight - (element.scrollTop + element.clientHeight),
    ) <= 100 // Allow for a small margin of error
  );
}

const MIN_SPACING = 200;
export function useChatScroll({
  messages,
  areChatsLoading,
}: {
  messages: any[];
  areChatsLoading: boolean;
}) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollButtonRef = useRef<HTMLButtonElement>(null);
  const [activateScroll, setActivateScroll] = useState(false);
  const [isFirstScrollFired, setIsFirstScrollFired] = useState(true);

  useEffect(() => {
    const abortController = new AbortController();
    messagesContainerRef.current?.addEventListener(
      'scroll',
      () => {
        if (!scrollButtonRef.current) return;
        scrollButtonRef.current.style.display =
          !messagesContainerRef.current ||
          isScrolledToBottom(messagesContainerRef.current)
            ? 'none'
            : 'block';
      },
      { signal: abortController.signal },
    );
    return () => abortController.abort();
  }, []);

  useEffect(() => {
    if (
      scrollButtonRef.current &&
      scrollRef.current &&
      scrollRef.current.scrollHeight === scrollRef.current.clientHeight
    ) {
      scrollButtonRef.current.style.display = 'none';
    }
    if (isFirstScrollFired && !areChatsLoading) {
      setIsFirstScrollFired(false);
      scrollRef.current?.scrollIntoView({ behavior: 'instant' });
      return;
    }
    if (!messages.length || !scrollRef.current || !activateScroll) return;
    if (messages[messages.length - 1]?.role === 'user') {
      const newHeight = calculateMaxPadding();
      scrollRef.current.style.height = `${newHeight}px`;
      scrollRef.current.scrollIntoView({ behavior: 'instant' });
      return;
    }
    const newHeight = calculatePadding();
    scrollRef.current.style.height = `${newHeight}px`;
  }, [messages, activateScroll, areChatsLoading]);

  function calculateMaxPadding() {
    if (!messagesContainerRef.current) return MIN_SPACING;
    const actualMessagesContainer = messagesContainerRef.current.firstChild;
    const lastUserMessage = actualMessagesContainer?.lastChild;
    const lastUserMessageHeight =
      lastUserMessage?.getBoundingClientRect().height;
    const height = Math.max(
      window.innerHeight - lastUserMessageHeight,
      MIN_SPACING,
    );
    return height;
  }

  function calculatePadding() {
    if (!messagesContainerRef.current) return MIN_SPACING;
    const actualMessagesContainer = messagesContainerRef.current.firstChild;
    const lastMessage = actualMessagesContainer?.lastChild;
    const lastUserMessageHeight = lastMessage?.getBoundingClientRect().height;
    const height = Math.max(
      window.innerHeight - lastUserMessageHeight,
      MIN_SPACING,
    );
    return height;
  }

  return {
    setActivateScroll,
    scrollRef,
    messagesContainerRef,
    scrollButtonRef,
  };
}
