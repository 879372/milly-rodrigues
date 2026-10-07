import { useCallback, useRef } from 'react';

type Options = {
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  rootMargin?: string;
};

/**
 * Returns a ref callback to attach to a sentinel element at the end of a list.
 * When the sentinel scrolls into view, the next page is fetched.
 */
export function useInfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  rootMargin = '400px',
}: Options) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  return useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        },
        { rootMargin }
      );
      observerRef.current.observe(node);
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage, rootMargin]
  );
}

export type Paginated<T> = {
  count: number;
  next: number | string | null;
  previous: number | string | null;
  results: T[];
};

/** Shared getNextPageParam for `?page=N` style endpoints. */
export function getNextPageParam<T>(
  lastPage: Paginated<T>,
  allPages: Paginated<T>[]
): number | undefined {
  const loaded = allPages.reduce((sum, p) => sum + p.results.length, 0);
  return loaded < lastPage.count ? allPages.length + 1 : undefined;
}
