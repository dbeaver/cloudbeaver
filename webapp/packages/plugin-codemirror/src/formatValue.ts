/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export async function formatValue(value: string, mode: string | undefined): Promise<string> {
  try {
    switch (mode) {
      case 'application/json':
        return JSON.stringify(JSON.parse(value), null, 2);
      case 'text/html':
      case 'text/xml': {
        const prettier = await import('prettier');
        const parserHTML = await import('prettier/parser-html');

        return prettier.format(value, {
          plugins: [parserHTML],
        });
      }
      default:
        if (!mode || mode.includes('sql')) {
          const { format } = await import('sql-formatter');
          return format(value);
        }
        return value;
    }
  } catch {
    return value;
  }
}
