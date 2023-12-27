/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useObjectRef } from '@cloudbeaver/core-blocks';
import { base64ToHex } from '@cloudbeaver/core-utils';

import type { IResultSetContentValue } from '../../DatabaseDataModel/Actions/ResultSet/IResultSetContentValue';

export function useAutoFormat() {
  return useObjectRef(
    () => ({
      format(type: string, value: string) {
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
      },
      async formatBlob(type: string, value: IResultSetContentValue) {
        if (!value.binary) {
          return value.text;
        }

        switch (type) {
          case 'text/base64':
            return value.binary;
          case 'text/hex':
            return base64ToHex(value.binary);
          default:
            return value.text;
        }
      },
    }),
    false,
  );
}
