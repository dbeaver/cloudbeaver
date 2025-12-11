/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useSyncExternalStore } from 'react';

import { LoadingError } from '@cloudbeaver/core-utils';

/**
 * State of a lazy loaded module
 */
export interface ILazyLoadState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Lazy loader instance - created once, shared across components.
 * Loading starts when the first component subscribes via `subscribe()`.
 */
export interface ILazyLoader<T> {
  /** Subscribe to state changes. Triggers loading on first subscription. */
  subscribe(onStoreChange: () => void): () => void;
  /** Get current state snapshot */
  getSnapshot(): ILazyLoadState<T>;
  /** Force refresh - clears cache and reloads */
  refresh(): void;
}

/**
 * Creates a lazy loader that only executes the factory when a component subscribes.
 * The result is cached as a singleton.
 *
 * @example
 * // Module level - doesn't execute import yet!
 * const codemirrorLoader = createLazyLoader(() => import('@cloudbeaver/plugin-codemirror6'));
 *
 * // In component - triggers import on first subscription
 * const codemirror = useLazyImport(codemirrorLoader);
 *
 * if (codemirror === null) {
 *   return <PlainTextFallback />; // Fallback while loading or on error
 * }
 *
 * return <Editor module={codemirror} />;
 */
export function createLazyLoader<T>(factory: () => Promise<T>): ILazyLoader<T> {
  let state: ILazyLoadState<T> = {
    data: null,
    loading: false,
    error: null,
  };
  let promise: Promise<T> | null = null;
  const listeners = new Set<() => void>();

  function notify() {
    listeners.forEach(listener => listener());
  }

  function load() {
    // Already loaded or loading
    if (state.data !== null || promise !== null) {
      return;
    }

    state = { ...state, loading: true, error: null };
    // Don't notify here - we're in sync phase, subscribers will get the state via getSnapshot

    promise = factory();

    promise
      .then(data => {
        state = { data, loading: false, error: null };
      })
      .catch((cause: Error) => {
        state = {
          data: null,
          loading: false,
          error: new LoadingError(() => refresh(), "Can't load element", { cause }),
        };
        promise = null; // Allow retry on error
      })
      .finally(() => {
        notify();
      });
  }

  function refresh() {
    promise = null;
    state = { data: null, loading: false, error: null };
    load();
    notify();
  }

  return {
    subscribe(onStoreChange: () => void) {
      // Trigger load on first subscription
      load();

      listeners.add(onStoreChange);
      return () => {
        listeners.delete(onStoreChange);
      };
    },

    getSnapshot() {
      return state;
    },

    refresh,
  };
}

/**
 * Hook to use a lazy loaded module without triggering Suspense.
 * Returns null while loading, throws error if loading fails (can be caught by error boundaries).
 *
 * @example
 * const codemirror = useLazyImport(codemirrorLoader);
 *
 * if (codemirror === null) {
 *   return <PlainTextEditor />; // Fallback while loading
 * }
 *
 * return <CodeMirrorEditor dialect={codemirror.SQLDialect} />;
 */
export function useLazyImport<T>(loader: ILazyLoader<T>): T | null {
  const { data, error } = useSyncExternalStore(loader.subscribe, loader.getSnapshot, loader.getSnapshot);

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Hook that returns full loading state for more control.
 * Use this when you need to handle loading and error states explicitly.
 *
 * @example
 * const { data, loading, error } = useLazyImportState(codemirrorLoader);
 *
 * if (error) {
 *   return <ErrorMessage error={error} />;
 * }
 *
 * if (!data) {
 *   return <Loader />;
 * }
 *
 * return <Editor module={data} />;
 */
export function useLazyImportState<T>(loader: ILazyLoader<T>): ILazyLoadState<T> {
  return useSyncExternalStore(loader.subscribe, loader.getSnapshot, loader.getSnapshot);
}
