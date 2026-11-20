/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useEffect } from 'react';

let gridCount = 0;
let unsubscribe: (() => void) | undefined;

export function useGridErrorFilter(): void {
  useEffect(() => {
    if (gridCount++ === 0) {
      const previous = window.onerror;
      const handler: OnErrorEventHandler = (event, source, line, column, error) => {
        // Auto-sized columns can resize the observed content box when scrollbars change.
        if (!error && event === 'ResizeObserver loop completed with undelivered notifications.') {
          return true;
        }

        return previous?.call(window, event, source, line, column, error);
      };

      window.onerror = handler;
      unsubscribe = () => {
        if (window.onerror === handler) {
          window.onerror = previous;
        }
      };
    }

    return () => {
      if (--gridCount === 0) {
        unsubscribe?.();
        unsubscribe = undefined;
      }
    };
  }, []);
}
