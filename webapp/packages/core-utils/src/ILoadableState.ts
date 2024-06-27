/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface ILoadableState {
  readonly promise?: Promise<any> | null;
  readonly exception?: (Error | null)[] | Error | null;
  lazy?: boolean;
  isLoading: () => boolean;
  isLoaded: () => boolean;
  isError: () => boolean;
  load: () => void | Promise<void>;
  reload?: () => void | Promise<void>;

  isOutdated?: () => boolean;
  isCancelled?: () => boolean;
  cancel?: () => void;
}

export function isLoadableStateHasException(state: ILoadableState): boolean {
  return isContainsException(state.exception);
}

export function isContainsException(exception?: (Error | null)[] | Error | null): exception is Error[] | Error {
  if (Array.isArray(exception)) {
    return exception.some(Boolean);
  }

  return !!exception;
}

export function getFirstException(exception?: (Error | null)[] | Error | null): Error | null {
  if (Array.isArray(exception)) {
    return exception.find(Boolean) || null;
  }

  return exception || null;
}
