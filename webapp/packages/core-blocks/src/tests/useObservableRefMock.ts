/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function useObservableRefMock(_init: any, _observed: any, update: any): Record<string, any> {
  return { ...update, ..._init() };
}
