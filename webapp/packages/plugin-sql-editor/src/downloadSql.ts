/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { download } from '@cloudbeaver/core-utils';

export function downloadSql(name: string, script: string): void {
  const blob = new Blob([script], {
    type: 'application/sql',
  });
  download(blob, `${name}.sql`);
}
