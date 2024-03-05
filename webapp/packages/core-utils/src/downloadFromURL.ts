/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function downloadFromURL(url: string): Promise<Blob> {
  const req = new XMLHttpRequest();
  req.open('GET', url, true);
  req.responseType = 'blob';

  let resolve: (value: Blob) => void;
  let reject: (reason?: any) => void;
  const promise = new Promise<Blob>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  req.onload = () => {
    resolve(req.response);
  };

  req.onerror = e => {
    reject(e);
  };

  req.send();

  return promise;
}
