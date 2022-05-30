/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function uriToBlob(uri: string): Blob {
  const byteString = window.atob(uri.split(',')[1]);
  const mimeString = uri.split(',')[0].split(':')[1].split(';')[0];
  const buffer = new ArrayBuffer(byteString.length);
  const view = new Uint8Array(buffer);

  for (let i = 0; i < byteString.length; i++) {
    view[i] = byteString.charCodeAt(i);
  }

  return new Blob([buffer], { type: mimeString });
}