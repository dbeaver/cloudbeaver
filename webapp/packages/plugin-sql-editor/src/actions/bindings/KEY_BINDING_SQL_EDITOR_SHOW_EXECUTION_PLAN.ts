/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createKeyBinding } from '@cloudbeaver/core-view';


export const KEY_BINDING_SQL_EDITOR_SHOW_EXECUTION_PLAN = createKeyBinding({
  id: 'sql-editor-show-execution-plan',
  label: 'Shift + Ctrl + E',
  keys: 'shift+ctrl+e',
  preventDefault: true,
});
