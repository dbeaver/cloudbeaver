/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useObjectRef } from '@cloudbeaver/core-blocks';

import type { LangMode } from './LANG_EXT';

export function useAutoFormat(mode: LangMode | undefined) {
  return useObjectRef(() => ({
    format(value: string) {
      try {
        switch (this.mode) {
          case 'json':
            return JSON.stringify(JSON.parse(value), null, 2);
          case 'xml':
          case 'html':
            return value;
          default:
            return value;
        }
      } catch {
        return value;
      }
    },
  }), { mode });
}
