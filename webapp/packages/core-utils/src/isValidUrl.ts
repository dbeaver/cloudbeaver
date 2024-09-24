/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

// test freezes with '5999999999999000000000000000000000000000000'
// const urlPattern = new RegExp(
//   '^(https?:\\/\\/)?' + // protocol
//     '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
//     '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
//     '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
//     '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
//     '(\\#[-a-z\\d_]*)?$',
//   'i',
// ); // fragment locator

const serverUrlPattern = /^(https:\/\/)?(localhost|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?(\/.*)?$/i;

export function isValidUrl(value: string): boolean {
  return value.startsWith('https://') || value.startsWith('http://');
}

export function isValidServerUrl(value: string): boolean {
  return serverUrlPattern.test(value);
}
