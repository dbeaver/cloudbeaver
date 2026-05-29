/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

const xmlDeclaration = '<?xml version="1.0" standalone="no"?>\r\n';

export function svgToBlob(src: string): Blob {
  return new Blob([xmlDeclaration, src], { type: 'image/svg+xml;charset=utf-8' });
}
