/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createKeyBinding } from '../createKeyBinding';

export const KEY_BINDING_OPEN_IN_TAB = createKeyBinding({
  id: 'open-in-tab',
  label: 'Alt + T',
  keys: 'alt+t',
  preventDefault: true,
});
