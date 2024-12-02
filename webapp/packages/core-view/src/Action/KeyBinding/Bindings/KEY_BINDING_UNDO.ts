/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createKeyBinding } from '../createKeyBinding.js';

export const KEY_BINDING_UNDO = createKeyBinding({
  id: 'undo',
  keys: 'mod+z',
  preventDefault: true,
});
