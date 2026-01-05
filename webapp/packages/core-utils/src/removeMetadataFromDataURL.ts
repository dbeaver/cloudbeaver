/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function removeMetadataFromDataURL(base64: string): string {
  const prefix = 'data:';
  const marker = ';base64,';

  if (base64.startsWith(prefix)) {
    const pos = base64.indexOf(marker);

    if (pos !== -1) {
      return base64.slice(pos + marker.length);
    }
  }

  return base64;
}
