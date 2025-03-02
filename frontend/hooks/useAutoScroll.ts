import { useRef, useEffect, RefObject } from "react";

interface AutoScrollOptions {
  messages: any[];
  isThinking: boolean;
  isStreaming: boolean;
}


const useAutoScroll = ({ messages, isThinking, isStreaming }: AutoScrollOptions): any => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollLockedRef = useRef<boolean>(false);
  const lastMessageCountRef = useRef<number>(messages.length);
  const lastScrollHeightRef = useRef<number>(0);
  const userScrolledRef = useRef<boolean>(false);
  
  // Scroll to bottom of container
  const scrollToBottom = (force = false) => {
    const container = containerRef.current;
    if (!container) return;
    
    if (force || !isScrollLockedRef.current) {
      lastScrollHeightRef.current = container.scrollHeight;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: force ? 'auto' : 'smooth'
      });
    }
  };

  // When a new message arrives, if it's a user message, reset the scroll lock
  useEffect(() => {
    const isNewMessage = messages.length > lastMessageCountRef.current;
    if (isNewMessage && messages.length > 0) {
      if (messages[messages.length - 1]?.sender === "You") {
        isScrollLockedRef.current = false;
        userScrolledRef.current = false;
        setTimeout(() => scrollToBottom(true), 10);
      }
    }
    lastMessageCountRef.current = messages.length;
  }, [messages.length]);

  // During streaming, auto-scroll if not locked
  useEffect(() => {
    if (!isStreaming || isScrollLockedRef.current) return;
    
    const intervalId = setInterval(() => {
      const container = containerRef.current;
      if (!container || userScrolledRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      
      if (distanceFromBottom < 20 && container.scrollHeight > lastScrollHeightRef.current) {
        lastScrollHeightRef.current = container.scrollHeight;
        scrollToBottom(false);
      }
    }, 100);
    
    return () => clearInterval(intervalId);
  }, [isStreaming, messages]);

  // Lock auto-scroll immediately on any manual scrolling (especially scrolling up)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    let lastScrollTop = container.scrollTop;
    const SCROLL_THRESHOLD = 20;
    
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isScrollingUp = scrollTop < lastScrollTop;
      
      // Lock auto-scroll if the user scrolls up or makes a significant scroll move
      if (isScrollingUp || Math.abs(scrollTop - lastScrollTop) > 5) {
        userScrolledRef.current = true;
        isScrollLockedRef.current = true;
      }
      
      // Optionally, if the user manually scrolls completely to the bottom,
      // you can re-enable auto-scroll by uncommenting the following lines:
      // const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      // if (distanceFromBottom < 5) {
      //   userScrolledRef.current = false;
      //   isScrollLockedRef.current = false;
      // }
      
      lastScrollTop = scrollTop;
    };
    
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);
  
  // When AI is thinking and auto-scroll is not locked, scroll to bottom
  useEffect(() => {
    if (isThinking && !isScrollLockedRef.current) {
      scrollToBottom(false);
    }
  }, [isThinking]);
  
  return {
    containerRef,
    scrollToBottom,
    isFollowingScroll: !isScrollLockedRef.current,
    resetScrollFollow: () => {
      isScrollLockedRef.current = false;
      userScrolledRef.current = false;
      scrollToBottom(true);
    }
  };
};

export default useAutoScroll;
