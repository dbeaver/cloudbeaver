/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useObjectRef } from '@cloudbeaver/core-blocks';

export function useAutoFormat(type: string) {
  return useObjectRef(() => ({
    format(value: string) {
      try {
        switch (this.type) {
          case 'application/json':
            return JSON.stringify(JSON.parse(value), null, 2);
          case 'text/xml':
          case 'text/html':
            return value;
          default:
            return value;
        }
      } catch {
        return value;
      }
    },
  }), { type });
}
