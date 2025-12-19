/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { Mock } from 'vitest';

interface MockFileReaderInstance {
  onload: ((event: ProgressEvent<FileReader>) => void) | null;
  onerror: ((event: ProgressEvent<FileReader>) => void) | null;
  result: string | ArrayBuffer | null;
  readAsDataURL: (blob: Blob) => void;
}

export function mockFileReader(getResult: (() => string) | (() => Mock)): () => FileReader {
  return function mockFileReader() {
    const reader: MockFileReaderInstance = {
      onload: null,
      onerror: null,
      get result() {
        return getResult() as string;
      },
      readAsDataURL() {
        reader.onload?.({} as ProgressEvent<FileReader>);
      },
    };
    return reader as unknown as FileReader;
  };
}
