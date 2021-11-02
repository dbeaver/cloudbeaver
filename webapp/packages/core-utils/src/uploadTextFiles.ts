/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

interface UploadProcess {
  promise: Promise<string>;
  reader: FileReader;
}

type UploadData = Map<File, UploadProcess>;

export function uploadTextFiles(files: File[]): UploadData {
  const result: UploadData = new Map();

  for (const file of files) {
    const reader = new FileReader();

    const promise: Promise<string> = new Promise((resolve, reject) => {
      reader.readAsText(file);

      reader.onload = event => {
        const data = event.target?.result;

        if (data) {
          resolve(data as string);
        } else {
          reject(new Error(`No data for the file: "${file.name}"`));
        }
      };

      reader.onerror = event => {
        reject(new Error(`Error occurred reading file: "${file.name}"`));
        if (event.target?.error) {
          console.error(event.target.error);
        }
      };

      reader.onabort = () => reject(new Error(`Reading "${file.name}" is aborted`));
    });

    result.set(file, {
      promise,
      reader,
    });
  }

  return result;
}
