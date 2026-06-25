/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IKeyBinding } from '@cloudbeaver/core-view';

export const KEY_BINDING_OPEN_OBJECT_CONTEXT_MENU: IKeyBinding = {
  id: 'object-viewer-open-cell-context-menu',
  keys: ['mod+/'],
  preventDefault: true,
};
