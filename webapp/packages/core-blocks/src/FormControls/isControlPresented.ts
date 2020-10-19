/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function isControlPresented(name: string | undefined, state: any): boolean {
  if (state !== undefined && name !== undefined) {
    return name in state && state[name] !== null;
  }
  return true;
}
