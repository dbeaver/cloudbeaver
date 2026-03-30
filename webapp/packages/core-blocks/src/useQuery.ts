/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { type DependencyList, useEffect, useRef, useState } from 'react';

import { useDidUpdate } from './useDidUpdate.js';

/* The use query return type */
export interface IUseQueryOptions<QueryData, Data> {
  /* The enabled state of the query */
  enabled?: boolean;
  /* The depends for the hook */
  keys?: DependencyList;
  /* The placeholder data for the hook */
  placeholderData?: (() => Data) | Data;
  /* The refetch interval */
  refetchInterval?: number;
  /* The retry count of requests */
  retry?: boolean | number;
  /* The retry delay of requests */
  retryDelay?: ((retry: number, error: Error) => number) | number;
  /* The callback function to be invoked on error */
  onError?: (error: Error) => void;
  /* The callback function to be invoked on success */
  onSuccess?: (data: Data) => void;
  /* The select function to be invoked */
  select?: (data: QueryData) => Data;
}

interface IUseQueryCallbackParams {
  /* The depends for the hook */
  keys: DependencyList;
  /* The abort signal */
  signal: AbortSignal;
}

/* The use query return type */
export interface IUseQueryReturn<Data> {
  /* The abort function */
  abort: AbortController['abort'];
  /* The state of the query */
  data?: Data;
  /* The success state of the query */
  error?: Error;
  /* The error state of the query */
  isError: boolean;
  /* The fetching state of the query */
  isFetching: boolean;
  /* The loading state of the query */
  isLoading: boolean;
  /* The refetching state of the query */
  isRefetching: boolean;
  /* The success state of the query */
  isSuccess: boolean;
  /* The refetch function */
  refetch: () => void;
}

/**
 * @name useQuery
 * @description - Hook that defines the logic when query data
 *
 * @template Data The type of the data
 * @param {() => Promise<Data>} callback The callback function to be invoked
 * @param {DependencyList} [options.keys] The dependencies for the hook
 * @param {(data: Data) => void} [options.onSuccess] The callback function to be invoked on success
 * @param {(error: Error) => void} [options.onError] The callback function to be invoked on error
 * @param {UseQueryOptionsSelect<Data>} [options.select] The select function to be invoked
 * @param {Data | (() => Data)} [options.initialData] The initial data for the hook
 * @param {Data | (() => Data)} [options.placeholderData] The placeholder data for the hook
 * @param {number} [options.refetchInterval] The refetch interval
 * @param {boolean | number} [options.retry] The retry count of requests
 * @returns {UseQueryReturn<Data>} An object with the state of the query
 *
 * @example
 * const { data, isFetching, isLoading, isError, isSuccess, error, refetch, isRefetching, abort, aborted } = useQuery(() => fetch('url'));
 */
export function useQuery<QueryData, Data = QueryData>(
  callback: (params: IUseQueryCallbackParams) => Promise<QueryData>,
  options?: IUseQueryOptions<QueryData, Data>,
): IUseQueryReturn<Data> {
  const enabled = options?.enabled ?? true;
  const retryCountRef = useRef(options?.retry ? getRetry(options.retry) : 0);
  const alreadyRequested = useRef(false);

  const [isFetching, setIsFetching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);
  const [isSuccess, setIsSuccess] = useState(!!options?.placeholderData);

  const [error, setError] = useState<Error | undefined>(undefined);
  const [data, setData] = useState<Data | undefined>(options?.placeholderData);

  const abortControllerRef = useRef<AbortController>(new AbortController());
  const intervalIdRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const keys = options?.keys ?? [];

  function abort() {
    abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
  }

  function request(action: 'init' | 'refetch') {
    abort();

    setIsFetching(true);

    if (action === 'init') {
      alreadyRequested.current = true;
      setIsLoading(true);
    }

    if (action === 'refetch') {
      setIsRefetching(true);
    }

    callback({ signal: abortControllerRef.current.signal, keys })
      .then(response => {
        const data = options?.select ? options?.select(response) : response;
        options?.onSuccess?.(data as Data);
        setData(data as Data);
        setIsSuccess(true);
        setError(undefined);
        setIsError(false);
        setIsFetching(false);

        if (action === 'init') {
          setIsLoading(false);
        }

        if (action === 'refetch') {
          setIsRefetching(false);
        }
      })
      .catch((error: Error) => {
        if (retryCountRef.current > 0) {
          retryCountRef.current -= 1;
          const retryDelay = typeof options?.retryDelay === 'function' ? options?.retryDelay(retryCountRef.current, error) : options?.retryDelay;

          if (retryDelay) {
            setTimeout(() => request(action), retryDelay);
            return;
          }

          return request(action);
        }
        options?.onError?.(error);
        setData(undefined);
        setIsSuccess(false);
        setError(error);
        setIsError(true);
        setIsFetching(false);

        if (action === 'init') {
          setIsLoading(false);
        }

        if (action === 'refetch') {
          setIsRefetching(false);
        }

        retryCountRef.current = options?.retry ? getRetry(options.retry) : 0;
      })
      .finally(() => {
        if (options?.refetchInterval) {
          const interval = setInterval(() => {
            clearInterval(interval);
            request('refetch');
          }, options?.refetchInterval);
          intervalIdRef.current = interval;
        }
      });
  }

  useEffect(() => {
    if (!enabled) {
      return;
    }

    request('init');
  }, []);

  useDidUpdate(() => {
    if (!enabled) {
      return;
    }

    request(alreadyRequested.current ? 'refetch' : 'init');
  }, [enabled, ...keys]);

  useEffect(() => () => clearInterval(intervalIdRef.current), [enabled, options?.refetchInterval, options?.retry, ...keys]);

  function refetch() {
    request('refetch');
  }

  return {
    abort,
    data,
    error,
    refetch,
    isFetching,
    isLoading,
    isError,
    isSuccess,
    isRefetching,
  };
}

function getRetry(retry: boolean | number) {
  if (typeof retry === 'number') {
    return retry;
  }

  return retry ? 1 : 0;
}
