/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function getDomainFromUrl(url: string): string {
  try {
    const urlObject = new URL(url);
    return urlObject.hostname;
  } catch (e) {
    console.error('Invalid URL:', e);
    return '';
  }
}
