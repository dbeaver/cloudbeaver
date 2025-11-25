/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function useObservableRefMock(_init: any, _observed: any, update: any): Record<string, any> {
  const state = _init();

  if (update) {
    for (const [key, value] of Object.entries(update)) {
      if (!(key in state) || state[key] !== value) {
        state[key] = value;
      }
    }
  }

  return state;
}
