/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { HTML_EDITOR, JSON_EDITOR, XML_EDITOR } from '@cloudbeaver/plugin-codemirror6';

// @TODO These imports are quite heavy
export function getTypeExtension(type: string) {
  switch (type) {
    case 'application/json':
      return JSON_EDITOR();
    case 'text/html':
      return HTML_EDITOR();
    case 'text/xml':
      return XML_EDITOR();
    default:
      return;
  }
}
