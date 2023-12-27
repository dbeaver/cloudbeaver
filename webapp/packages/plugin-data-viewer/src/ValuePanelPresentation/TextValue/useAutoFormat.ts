/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useObjectRef } from '@cloudbeaver/core-blocks';
import { blobToBase64, blobToHex } from '@cloudbeaver/core-utils';

export function useAutoFormat() {
  return useObjectRef(
    () => ({
      format(type: string, value: string) {
        if (typeof value === 'string') {
          try {
            switch (type) {
              case 'application/json':
                return JSON.stringify(JSON.parse(value), null, 2);
              case 'text/xml':
              case 'text/html':
                return value;
              case 'text/plain':
              default:
                return value;
            }
          } catch {
            return value;
          }
        }

        return value;
      },
      async formatBlob(type: string, value: Blob) {
        try {
          switch (type) {
            case 'test/base64':
              return blobToBase64(value);
            case 'text/hex':
              return blobToHex(value);
            default:
              return value.text();
          }
        } catch {
          return value.text().catch(() => {
            throw new Error('Failed to read Blob');
          });
        }
      },
    }),
    false,
  );
}
