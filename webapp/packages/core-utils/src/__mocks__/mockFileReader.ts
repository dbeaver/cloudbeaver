/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { Mock } from 'vitest';

export function mockFileReader(getResult: (() => string) | (() => Mock)): void {
  const fileReader = class MockFileReader extends FileReader {
    constructor() {
      super();
      Object.defineProperty(this, 'result', {
        get: getResult,
      });
    }

    override readAsDataURL() {
      this.onload?.({} as ProgressEvent<FileReader>);
    }
  };

  Object.defineProperty(globalThis, 'FileReader', {
    writable: true,
    value: fileReader,
  });
}