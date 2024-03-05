/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function blobToBase64(blob: Blob | File, slice?: number): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      resolve(fileReader.result as string | null);
    };
    fileReader.onerror = () => {
      reject(fileReader.error);
    };

    if (slice) {
      blob = blob.slice(0, slice);
    }

    fileReader.readAsDataURL(blob);
  });
}
