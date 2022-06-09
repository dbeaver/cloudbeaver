/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function blobToData(blob: Blob): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      resolve(fileReader.result as string | null);
    };
    fileReader.onerror = () => {
      reject(fileReader.error);
    };

    fileReader.readAsDataURL(blob);
  });
}