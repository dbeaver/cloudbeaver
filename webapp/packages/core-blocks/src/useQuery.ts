/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useState, useEffect, useRef, useLayoutEffect } from 'react';

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/** We can use this if we don’t have ILoadableState and we fetch data that is not supposed to be kept in the resource */
export function useQuery<T>(queryFn: () => Promise<T>, deps: any[] = []): QueryState<T> {
  const [state, setState] = useState<QueryState<T>>({
    data: null,
    loading: true,
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
          setState(prev => ({ ...prev, loading: false }));
          return;
        }

        setState({ data: null, loading: false, error });
      });

    return () => abortRef.current?.abort();
  }, deps);

  return state;
}
