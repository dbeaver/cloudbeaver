/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function removeMetadataFromBase64(base64: string) {
  const parts = base64.split(',');

  if (parts[1]) {
    return parts[1];
  }

  return parts[0];
}