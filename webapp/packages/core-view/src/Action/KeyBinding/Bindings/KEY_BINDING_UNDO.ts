/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createKeyBinding } from '../createKeyBinding';

export const KEY_BINDING_UNDO = createKeyBinding({
  id: 'undo',
  label: 'Ctrl + Z',
  keys: 'ctrl+z',
  keysMac: 'cmd+z',
  preventDefault: true,
});
