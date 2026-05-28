/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { download } from '@cloudbeaver/core-utils';

function sanitizeFilename(filename: string): string {
  // Remove or replace invalid filesystem characters
  return filename
    .replace(/[/\\:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 255); // Max filename length for most filesystems
}

export function downloadSql(name: string, script: string): void {
  if (!name || name.trim().length === 0) {
    throw new Error('Filename cannot be empty');
  }

  if (!script) {
    throw new Error('Script content cannot be empty');
  }

  const sanitizedName = sanitizeFilename(name);
  const blob = new Blob([script], {
    type: 'application/sql',
  });
  download(blob, `${sanitizedName}.sql`);
}
