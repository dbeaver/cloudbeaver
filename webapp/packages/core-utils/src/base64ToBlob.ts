/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function base64ToBlob(base64: string, mime = 'application/octet-stream', partSize = 512): Blob {
  const byteCharacters = atob(base64);
  const byteArrays = [];
  let slice: string;

  for (let offset = 0; offset < byteCharacters.length; offset += partSize) {
    slice = byteCharacters.slice(offset, offset + partSize);

    const byteNumbers = new Array(slice.length);

    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    byteArrays.push(new Uint8Array(byteNumbers));
  }

  return new Blob(byteArrays, { type: mime });
}
