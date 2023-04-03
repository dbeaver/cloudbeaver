/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function isControlPresented(
  name: string | undefined, state: any, defaultValue?: string | number | readonly string[]
): boolean {
  if (state !== undefined && name !== undefined) {
    if (name in state) {
      return state[name] !== null && state[name] !== undefined;
    }
    return defaultValue !== undefined;
  }
  return true;
}
