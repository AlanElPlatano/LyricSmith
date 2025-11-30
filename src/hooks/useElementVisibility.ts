import { useEffect, useState, RefObject } from 'react';

export function useElementVisibility(ref: RefObject<HTMLElement>, threshold = 0.1): boolean {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, threshold]);

  return isVisible;
}
