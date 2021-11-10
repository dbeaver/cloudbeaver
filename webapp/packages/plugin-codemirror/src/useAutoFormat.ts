/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ModeSpec } from 'codemirror';
import prettier from 'prettier';
import parserHTML from 'prettier/parser-html';
import { format as formatSQL } from 'sql-formatter';

import { useObjectRef } from '@cloudbeaver/core-blocks';

export function useAutoFormat(mode: string | ModeSpec<any> | undefined) {
  let modeName = 'sql';

  if (typeof mode === 'string') {
    modeName = mode;
  } else if (typeof mode === 'object') {
    modeName = mode.name;
  }

  return useObjectRef(() => ({
    format(value: string) {
      try {
        switch (this.mode) {
          case 'application/json':
            return JSON.stringify(JSON.parse(value), null, 2);
          case 'text/xml':
          case 'text/html':
            return prettier.format(value, {
              plugins: [parserHTML],
            });
          default:
            if (this.mode.includes('sql')) {
              return formatSQL(value);
            }
            return value;
        }
      } catch {
        return value;
      }
    },
  }), { mode: modeName });
}
