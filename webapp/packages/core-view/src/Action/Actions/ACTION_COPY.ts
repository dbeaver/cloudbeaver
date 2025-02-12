/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createAction } from '../createAction.js';

export const ACTION_COPY = createAction('copy', {
  label: 'ui_copy_to_clipboard',
  icon: 'copy',
});
