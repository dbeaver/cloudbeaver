/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function utf8ToBase64(data: string): string {
  /*  first we use encodeURIComponent to get percent-encoded UTF-8,
   then we convert the percent encodings into raw bytes which can be fed into btoa. */
  return window.btoa(decodeURIComponent(encodeURIComponent(data).replace(/%([0-9A-F]{2})/g, (match, p1) => {
    const c = String.fromCharCode(parseInt(`0x${p1}`, 16));
    return c === '%' ? '%25' : c;
  })));
}
