/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function getMIME(binary: string): string | null {
  if (binary.length === 0) {
    return null;
  }

  switch (binary[0]) {
    case '/':
      return 'image/jpeg';
    case 'i':
      return 'image/png';
    case 'R':
      return 'image/gif';
    case 'U':
      return 'image/webp';
    default:
      return null;
  }
}
