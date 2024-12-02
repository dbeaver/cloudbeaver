/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

const dataUrlFilter = /data:(.*?)\/(.*?);base64,(.*)/;

export function removeMetadataFromDataURL(base64: string): string {
  const matches = base64.match(dataUrlFilter);

  if (!matches) {
    return base64;
  }

  return matches[3]!;
}
