/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createKeyBinding } from '../createKeyBinding.js';

export const KEY_BINDING_REDO = createKeyBinding({
  id: 'redo',
  keys: ['mod+y', 'shift+mod+z'],
  preventDefault: true,
});
