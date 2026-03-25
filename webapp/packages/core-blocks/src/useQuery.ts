import { useState, useEffect, useRef, useLayoutEffect } from 'react';

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useQuery<T>(queryFn: () => Promise<T>, deps: any[] = []): QueryState<T> {
  const [state, setState] = useState<QueryState<T>>({
    data: null,
    loading: true, // start as true
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);
  const queryFnRef = useRef(queryFn);

  useLayoutEffect(() => {
    queryFnRef.current = queryFn;
  }, [queryFn]);

  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    queryFnRef
      .current()
      .then(data => setState({ data, loading: false, error: null }))
      .catch(error => {
        if (error.name === 'AbortError') {
          return;
        }

        setState({ data: null, loading: false, error });
      });

    return () => abortRef.current?.abort();
  }, deps);

  return state;
}
