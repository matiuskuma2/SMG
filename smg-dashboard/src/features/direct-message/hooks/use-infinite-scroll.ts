import { useEffect, useRef } from 'react';
import { useMessageContext } from './use-messages';

export const useMessageInfiniteScroll = () => {
  const { fetchNext, hasMore } = useMessageContext();
  const isFetchingNext = useRef(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const loadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNext.current && hasMore) {
          isFetchingNext.current = true;
          fetchNext().finally(() => {
            isFetchingNext.current = false;
          });
        }
      },
      {
        root: rootRef.current,
        threshold: 0.1,
        rootMargin: '100px 0px 0px 0px',
      },
    );

    if (loadRef.current) observer.current.observe(loadRef.current);

    return () => {
      observer.current?.disconnect();
    };
  });

  return { rootRef, loadRef };
};
