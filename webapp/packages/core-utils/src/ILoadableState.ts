/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface ILoadableState {
  lazy?: boolean;
  isLoading: () => boolean;
  isLoaded: () => boolean;
  isError: () => boolean;
  readonly exception?: (Error | null)[] | Error | null;
  load: () => void;
  reload?: () => void;

  isOutdated?: () => boolean;
  isCancelled?: () => boolean;
  cancel?: () => void;
}

// export function composeLoadableState(...states: ILoadableState[]): ILoadableState {

// }

export function isLoadableStateHasException(state: ILoadableState): boolean {
  return isContainsException(state.exception);
}

export function isContainsException(exception?: (Error | null)[] | Error | null): boolean {
  if (Array.isArray(exception)) {
    return exception.some(Boolean);
  }

  return !!exception;
}