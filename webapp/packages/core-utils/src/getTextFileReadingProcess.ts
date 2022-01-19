/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

interface UploadProcess<T> {
  promise: Promise<T>;
  reader: FileReader;
}

export function getTextFileReadingProcess(file: File): UploadProcess<string> {
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

  return {
    promise,
    reader,
  };
}
